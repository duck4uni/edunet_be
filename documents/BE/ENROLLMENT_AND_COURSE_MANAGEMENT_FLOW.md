# Luồng Đăng Ký & Quản Lí Khóa Học

## I. Luồng Đăng Ký Khóa Học (Enrollment Flow)

### 1. Trạng Thái Enrollment

```
┌─────────────┐
│   PENDING   │  ← Học sinh vừa đăng ký, chờ phê duyệt
└──────┬──────┘
       │
       ├─────→ ✓ Phê duyệt (approve) ──→ │ ACTIVE │  (Vào lớp được)
       │                                  └────────┘
       │                                      │
       │                                      ├─→ Học bài → │ COMPLETED │ (Hoàn thành khóa học)
       │                                      │             └────────────┘
       │                                      │
       │                                      └─→ Thôi học → │ DROPPED │ (Bỏ cuộc giữa đường)
       │
       └─────→ ✗ Từ chối (reject) ──→ │ REJECTED │  (Bị từ chối)
                                       └──────────┘

Các trạng thái khác:
- EXPIRED: Khóa học hết hạn (nếu có deadline)
```

### 2. API Endpoints Trong Luồng Đăng Ký

#### **Bước 1: Học sinh đăng ký khóa học**
```http
POST /api/enrollments/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "uuid-of-course"
}

Response (201 Created):
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "enrollment-uuid",
    "userId": "student-uuid",
    "courseId": "course-uuid",
    "status": "pending",        ← Trạng thái mới!
    "progress": 0,
    "createdAt": "2026-04-06T...",
    "updatedAt": "2026-04-06T..."
  }
}
```

#### **Bước 2: Giáo viên/Admin xem danh sách chờ phê duyệt**
```http
GET /api/enrollments/course/{courseId}?filter=status:eq:pending
Authorization: Bearer <token>
```

#### **Bước 3a: Phê duyệt đăng ký**
```http
PATCH /api/enrollments/{enrollmentId}/approve
Authorization: Bearer <teacher-or-admin-token>

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "enrollment-uuid",
    "status": "active",         ← Đã phê duyệt
    ...
  }
}
```

#### **Bước 3b: Từ chối đăng ký**
```http
PATCH /api/enrollments/{enrollmentId}/reject
Authorization: Bearer <teacher-or-admin-token>

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "enrollment-uuid",
    "status": "rejected",       ← Bị từ chối
    ...
  }
}
```

#### **Bước 4: Học sinh kiểm tra trạng thái đăng ký**
```http
GET /api/enrollments/check/{courseId}
Authorization: Bearer <student-token>

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "enrolled": true,           ← true nếu status = active hoặc completed
    "isPending": true,          ← true nếu status = pending
    "enrollment": {
      "id": "...",
      "status": "pending",      ← Trạng thái hiện tại
      ...
    }
  }
}
```

---

## II. Luồng Quản Lí Khóa Học (Course Management Flow)

### 1. Các Vai Trò (Roles)

| Vai Trò | Quyền |
|---------|--------|
| **Teacher** | Tạo/sửa/xóa khóa học của mình, phê duyệt/từ chối học sinh, xem danh sách học sinh |
| **Admin** | Tạo/sửa/xóa bất kỳ khóa học nào, quản lí tất cả enrollment |
| **Student** | Xem/đăng ký khóa học, xem bài học, làm bài tập/quiz |
| **Public** | Xem danh sách khóa học công khai (không authed) |

### 2. API Endpoints Quản Lí Khóa Học

#### **Giáo viên tạo khóa học**
```http
POST /api/courses
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "title": "Lập trình Node.js",
  "description": "Khóa học từ cơ bản đến nâng cao",
  "categoryId": "category-uuid",
  "teacherId": "teacher-uuid",
  "level": "intermediate",
  "maxStudents": 50,
  "startDate": "2026-05-01",
  "endDate": "2026-08-31",
  "status": "active"
}

Response (201):
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "course-uuid",
    "title": "Lập trình Node.js",
    "teacherId": "teacher-uuid",
    ...
  }
}
```

#### **Xem tất cả khóa học (công khai, không cần auth)**
```http
GET /api/courses
Query params:
  - page=1&size=10           (phân trang)
  - sort=createdAt:desc      (sắp xếp)
  - filter=status:eq:active  (bộ lọc)
  - include=teacher|category (quan hệ)

Response:
{
  "success": true,
  "statusCode": 200,
  "data": {
    "rows": [
      { "id": "...", "title": "...", "teacher": {...} },
      ...
    ],
    "count": 100
  }
}
```

#### **Chi tiết khóa học (công khai)**
```http
GET /api/courses/{courseId}
Query: include=teacher|category|lessons|enrollments

Response:
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "course-uuid",
    "title": "...",
    "teacher": { "id": "...", "name": "..." },
    "category": {...},
    "lessons": [...],
    "enrollments": [...],
    ...
  }
}
```

#### **Giáo viên sửa khóa học của mình**
```http
PATCH /api/courses/{courseId}
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "title": "Lập trình Node.js (cập nhật 2026)",
  "maxStudents": 60,
  "status": "active"
}

Response (200):
{
  "success": true,
  "statusCode": 200,
  "data": { ... }
}
```

#### **Giáo viên xóa khóa học (soft delete)**
```http
DELETE /api/courses/{courseId}
Authorization: Bearer <teacher-token>

Response (200):
{
  "success": true,
  "statusCode": 200,
  "data": { "message": "Course deleted successfully" }
}
```

#### **Admin xem danh sách học sinh đang chờ phê duyệt**
```http
GET /api/enrollments/course/{courseId}?filter=status:eq:pending
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "enrollment-1",
      "user": { "id": "...", "name": "Nguyễn Văn A", "email": "..." },
      "status": "pending",
      "createdAt": "2026-04-06T..."
    },
    ...
  ]
}
```

#### **Admin phê duyệt nhiều học sinh**
```http
PATCH /api/enrollments/{enrollmentId}/approve
Authorization: Bearer <admin-token>

→ Lặp lại cho mỗi enrollment cần phê duyệt
```

#### **Xem danh sách bài học trong khóa học**
```http
GET /api/lessons/course/{courseId}
Q: include=materials  (lấy cả materials trong mỗi bài)

Response:
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "lesson-1",
      "courseId": "...",
      "title": "Bài 1: Cài đặt môi trường",
      "materials": [
        { "id": "...", "title": "Setup guide.pdf" },
        { "id": "...", "title": "Video intro.mp4" }
      ]
    },
    ...
  ]
}
```

---

## III. Sơ Đồ Luồng (Flow Diagram)

### **Flow Đăng Ký Khóa Học**

```
┌──────────────┐
│   Student    │
└──────┬───────┘
       │
       ├─→ 1. GET /api/courses
       │      (xem danh sách khóa học)
       │
       ├─→ 2. GET /api/courses/{courseId}
       │      (xem chi tiết khóa học)
       │
       └─→ 3. POST /api/enrollments/enroll
              (đăng ký khóa học)
              
              Response: status = "pending"
              
              ┌─────────────────┐
              │ Chờ phê duyệt   │
              │ (Vào lớp: ❌)   │
              └────────┬────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
    ┌─────────────────┐    ┌──────────────────┐
    │  Teacher xem    │    │  Teacher xem     │
    │   pending list  │    │  pending list    │
    │ GET .../pending │    │ GET .../pending  │
    └────────┬────────┘    └────────┬─────────┘
             │                      │
    ┌────────▼─────────┐   ┌────────▼─────────┐
    │ PATCH .../approve│   │ PATCH .../reject │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
    ┌────────▼─────────┐   ┌────────▼─────────┐
    │ status = active  │   │ status = rejected│
    │ (Vào lớp: ✅)   │   │ (Vào lớp: ❌)   │
    └──────────────────┘   └──────────────────┘
```

### **Flow Quản Lí Khóa Học (Admin/Teacher)**

```
┌──────────────┬─────────┐
│   Admin      │ Teacher │
└──────┬───────┴────┬────┘
       │            │
       │ 1. POST /api/courses (chỉ teachers)
       │    → Tạo khóa học mới
       │
       ├─→ 2. GET /api/courses
       │      → Xem danh sách khóa học
       │
       ├─→ 3. PATCH /api/courses/{courseId}
       │      → Sửa khóa học
       │
       ├─→ 4. DELETE /api/courses/{courseId}
       │      → Xóa khóa học
       │
       ├─→ 5. POST /api/lessons
       │      → Tạo bài học
       │
       ├─→ 6. POST /api/materials
       │      → Thêm tài liệu cho bài
       │
       ├─→ 7. POST /api/assignments
       │      → Tạo bài tập
       │
       ├─→ 8. GET /api/enrollments/course/{courseId}?filter=status:eq:pending
       │      → Xem danh sách học sinh chờ phê duyệt
       │
       ├─→ 9. PATCH /api/enrollments/{enrollmentId}/approve
       │      → Phê duyệt học sinh
       │
       └─→ 10. PATCH /api/enrollments/{enrollmentId}/reject
              → Từ chối học sinh
```

---

## IV. Các Trạng Thái & Quy Tắc

### **Trạng Thái Enrollment - Chi Tiết**

| Trạng Thái | Mô Tả | Học Sinh Vào Lớp? | Ai Set |
|---|---|---|---|
| **pending** | Chờ phê duyệt | ❌ | System (khi đăng ký) |
| **active** | Được phê duyệt, đang học | ✅ | Teacher/Admin (approve) |
| **completed** | Hoàn thành khóa học | ✅ | System (khi progress = 100%) |
| **dropped** | Thôi học giữa đường | ❌ | Student (request) hoặc System |
| **rejected** | Bị từ chối | ❌ | Teacher/Admin (reject) |
| **expired** | Khóa học hết hạn | ❌ | System (khi endDate < now) |

### **Quy Tắc Kinh Doanh**

1. **Đăng ký** → tạo enrollment với `status = pending` (không tự động active)
2. **Chỉ học sinh có status = active/completed** mới thấy bài học & làm bài tập
3. **Phê duyệt** chỉ áp dụng cho enrollment với `status = pending`
4. **Từ chối** chỉ áp dụng cho enrollment với `status = pending`
5. **Không thay đổi trạng thái** một khi là `completed`, `rejected`, hay `dropped`

---

## V. Response Schemas

### **Enrollment Object**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "courseId": "uuid",
  "status": "pending | active | completed | dropped | rejected | expired",
  "progress": 0,          // 0-100 (%)
  "completedAt": null,    // ISO8601 timestamp
  "lastAccessedAt": null, // ISO8601 timestamp
  "createdAt": "2026-04-06T...",
  "updatedAt": "2026-04-06T...",
  "user": {               // optional (khi include=user)
    "id": "uuid",
    "name": "...",
    "email": "..."
  },
  "course": {             // optional (khi include=course)
    "id": "uuid",
    "title": "...",
    ...
  }
}
```

### **Course Object**
```json
{
  "id": "uuid",
  "title": "Lập trình Node.js",
  "description": "...",
  "categoryId": "uuid",
  "teacherId": "uuid",
  "level": "beginner | intermediate | advanced",
  "maxStudents": 50,
  "startDate": "2026-05-01",
  "endDate": "2026-08-31",
  "status": "active | archived | draft",
  "createdAt": "2026-04-06T...",
  "updatedAt": "2026-04-06T...",
  "teacher": {...},       // optional
  "category": {...},      // optional
  "lessons": [...],       // optional
  "enrollments": [...]    // optional
}
```

---

## VI. Ví Dụ Thực Tế

### **Scenario 1: Học sinh đăng ký, teacher phê duyệt**

```bash
# 1. Học sinh đăng ký
curl -X POST http://localhost:3000/api/enrollments/enroll \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "abc123"}'
# → status: pending ✓

# 2. Teacher xem danh sách pending
curl -X GET 'http://localhost:3000/api/enrollments/course/abc123?filter=status:eq:pending' \
  -H "Authorization: Bearer <teacher-token>"
# → Danh sách 1 học sinh chờ phê duyệt

# 3. Teacher phê duyệt
curl -X PATCH http://localhost:3000/api/enrollments/xyz789/approve \
  -H "Authorization: Bearer <teacher-token>"
# → status: active ✓

# 4. Học sinh kiểm tra
curl -X GET http://localhost:3000/api/enrollments/check/abc123 \
  -H "Authorization: Bearer <student-token>"
# → enrolled: true, isPending: false (vào lớp được!)
```

### **Scenario 2: Học sinh bị từ chối**

```bash
# 1. Đăng ký → status: pending

# 2. Teacher từ chối
curl -X PATCH http://localhost:3000/api/enrollments/xyz789/reject \
  -H "Authorization: Bearer <teacher-token>"
# → status: rejected ✓

# 3. Học sinh kiểm tra
curl -X GET http://localhost:3000/api/enrollments/check/abc123 \
  -H "Authorization: Bearer <student-token>"
# → enrolled: false, isPending: false, enrollment.status: rejected
```

---

## VII. Cách Deploy

### **1. Chạy migration**
```bash
npm run migration:migrate
```
Điều này cập nhật PostgreSQL enum type `EnrollmentStatus` thêm `pending` và `rejected`.

### **2. Restart server**
```bash
npm run start:dev
```

### **3. Test endpoints**
Dùng Postman hoặc curl như trong phần "Ví Dụ Thực Tế" để kiểm tra flow mới.

---

## VIII. Troubleshooting

| Vấn Đề | Nguyên Nhân | Giải Pháp |
|---------|---------|----------|
| "Only pending enrollments can be approved" | Enrollment không ở trạng thái `pending` | Kiểm tra status hiện tại của enrollment |
| Học sinh vẫn vào lớp được dù bị reject | Frontend không kiểm tra `enrollment.status` | Cập nhật logic frontend kiểm tra status |
| Migration fail | Enum value đã tồn tại | Chạy again hoặc check psql trực tiếp |
| Học sinh không thấy khóa học sau phê duyệt | Cần clear cache hoặc reload | Yêu cầu học sinh refresh trình duyệt |

---

**Tài Liệu cập nhật: 2026-04-06**
