# Luồng Phê Duyệt Khóa Học (Course Approval Flow)

## I. Tổng Quan

Khi **giáo viên** tạo khóa học, khóa học phải trải qua quy trình phê duyệt của admin trước khi hiển thị cho học sinh trên client.

Khi **admin** tạo khóa học, bỏ qua toàn bộ quy trình phê duyệt — khóa học được `published` ngay lập tức.

---

## II. Các Trạng Thái Khóa Học

```
[Teacher tạo]         [Admin tạo]
     │                     │
     ▼                     ▼ (skip approval)
┌─────────┐          ┌───────────┐
│ PENDING │          │ PUBLISHED │
└────┬────┘          └───────────┘
     │
     ├─── ✓ approve ──▶  ┌──────────┐
     │     PATCH /:id/review   │ APPROVED │
     │                   └─────┬────┘
     │                         │ publish (PATCH /:id/publish)
     │                         ▼
     │                   ┌───────────┐
     │                   │ PUBLISHED │  ← Học sinh thấy được
     │                   └───────────┘
     │
     └─── ✗ reject ───▶  ┌──────────┐
           PATCH /:id/review  │ REJECTED │  ← Giáo viên sửa lại và submit lại
                          └──────────┘

Trạng thái khác:
- DRAFT: Giáo viên đã lưu nháp, chưa gửi lên xét duyệt
- ARCHIVED: Admin ẩn khóa học đã công bố
```

---

## III. API Endpoints

### 1a. Giáo viên tạo khóa học

```http
POST /api/courses
Authorization: Bearer <teacher-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Lập trình NestJS nâng cao",
  "description": "Khóa học chuyên sâu về NestJS",
  "price": 299000,
  "level": "intermediate",
  "categoryId": "uuid-of-category"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "course-uuid",
    "title": "Lập trình NestJS nâng cao",
    "status": "pending",
    "teacherId": "teacher-uuid",
    "rejectionReason": null,
    ...
  }
}
```

> **Lưu ý:** `teacherId` được lấy tự động từ JWT. `status` luôn khởi tạo là `pending`.

---

### 1b. Admin tạo khóa học (không cần phê duyệt)

```http
POST /api/courses
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Khóa học do admin tạo",
  "price": 0,
  "teacherId": "uuid-of-teacher"  // tuỳ chọn: gán cho giáo viên cụ thể, nếu bỏ qua thì dùng id của admin
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "course-uuid",
    "status": "published",
    "publishedAt": "2026-04-06T10:00:00.000Z",
    ...
  }
}
```

> **Lưu ý:** Admin có thể truyền `teacherId` để gán khóa học cho một giáo viên cụ thể. Nếu không truyền, `teacherId` mặc định là id của admin. `status` tự động là `published` — không cần bất kỳ bước phê duyệt nào.

---

### 2. Giáo viên cập nhật khóa học (chỉ khi draft / rejected)

```http
PATCH /api/courses/:id
Authorization: Bearer <teacher-token>
Content-Type: application/json
```

**Ràng buộc:**
- Chỉ teacher sở hữu khóa học mới được sửa.
- Chỉ sửa được khi `status = draft` hoặc `status = rejected`.
- Nếu status là `pending` hoặc `approved`, API trả về `422 Unprocessable Entity`.

---

### 3. Giáo viên gửi yêu cầu xét duyệt

Dùng khi khóa học đang ở `draft` (chưa gửi lần nào) hoặc `rejected` (đã bị từ chối và đã sửa).

```http
PATCH /api/courses/:id/submit
Authorization: Bearer <teacher-token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "course-uuid",
    "status": "pending",
    "rejectionReason": null,
    ...
  }
}
```

---

### 4. Admin xem danh sách khóa học chờ duyệt

```http
GET /api/courses?filter=status:eq:pending
Authorization: Bearer <admin-token>
```

---

### 5. Admin phê duyệt hoặc từ chối khóa học

```http
PATCH /api/courses/:id/review
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body (approve):**
```json
{
  "status": "approved"
}
```

**Body (reject):**
```json
{
  "status": "rejected",
  "rejectionReason": "Nội dung khóa học chưa đầy đủ, cần bổ sung ít nhất 5 bài học."
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "course-uuid",
    "status": "approved",
    "publishedAt": "2026-04-06T10:00:00.000Z",
    ...
  }
}
```

> **Lưu ý:** Chỉ có thể review khi `status = pending`. Khi approve, trường `publishedAt` được tự động cập nhật.

---

### 6. Admin publish khóa học đã được duyệt

Chuyển trạng thái từ `approved` → `published` để học sinh trên client thấy được.

```http
PATCH /api/courses/:id/publish
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "course-uuid",
    "status": "published",
    ...
  }
}
```

---

### 7. Client (học sinh) xem danh sách khóa học

```http
GET /api/courses
```

> Không cần token. Học sinh chỉ thấy các khóa học có `status = published`. Admin và teacher thấy tất cả theo filter.

---

## IV. Phân Quyền Theo Role

| Endpoint | Student | Teacher | Admin |
|---|:---:|:---:|:---:|
| `POST /courses` | ✗ | ✓ (own → pending) | ✓ (→ published ngay) |
| `GET /courses` | ✓ (published only) | ✓ (all) | ✓ (all) |
| `GET /courses/:id` | ✓ | ✓ | ✓ |
| `PATCH /courses/:id` | ✗ | ✓ (own, draft/rejected) | ✓ |
| `PATCH /courses/:id/submit` | ✗ | ✓ (own) | ✗ |
| `PATCH /courses/:id/review` | ✗ | ✗ | ✓ |
| `PATCH /courses/:id/publish` | ✗ | ✗ | ✓ |
| `DELETE /courses/:id` | ✗ | ✓ (own) | ✓ |

---

## V. Luồng Đầy Đủ

```
[Teacher]                          [Admin]                        [Student/Client]
    │                                  │                                 │
    │ POST /courses                    │                                 │
    │──────────────────────────────────►                                 │
    │ status = "pending"               │                                 │
    │                                  │                                 │
    │                     GET /courses?filter=status:eq:pending          │
    │                           ◄──────┤                                 │
    │                     [Xem danh sách chờ duyệt]                     │
    │                                  │                                 │
    │         ┌────────────────────────┤ PATCH /courses/:id/review       │
    │         │                        │ { "status": "approved" }        │
    │         │                        │                                 │
    │         │              [hoặc]    │                                 │
    │         │                        │ { "status": "rejected",         │
    │         │                        │   "rejectionReason": "..." }    │
    │         │                        │                                 │
    │    [If rejected]          [If approved]                            │
    │    Sửa course,            PATCH /courses/:id/publish               │
    │    PATCH /:id/submit      ────────────────────────────────────────►│
    │                           status = "published"         Hiển thị   │
    │                                  │                      trên app  │
```

---

## VI. Các File Đã Thay Đổi / Tạo Mới

| File | Thay đổi |
|---|---|
| `src/course/entities/course.entity.ts` | Thêm column `rejectionReason` |
| `src/course/dto/create-course.dto.ts` | Xóa `status`; `teacherId` là optional (admin dùng) |
| `src/course/dto/update-course-status.dto.ts` | **Mới** — DTO cho admin approve/reject |
| `src/course/course.service.ts` | Thêm `submitForReview`, `updateStatus`, `publish`; admin tạo → published ngay |
| `src/course/course.controller.ts` | Thêm `POST /submit`, `PATCH /review`, `PATCH /publish`; gắn `RolesGuard` |
| `src/core/guards/roles.guard.ts` | **Mới** — Guard kiểm tra role |
| `src/core/decorators/roles.decorator.ts` | **Mới** — `@Roles()` decorator |
| `src/core/guards/index.ts` | Export thêm `RolesGuard` |
| `src/migrations/1775520001000-AddCourseApprovalFlow.ts` | **Mới** — Thêm column `rejectionReason` vào DB |

---

## VII. Luồng Từ Chối & Sửa Lại

Khi admin từ chối một khóa học:

1. `status` chuyển thành `rejected`
2. `rejectionReason` được lưu để giáo viên đọc
3. Giáo viên gọi `GET /api/courses/:id` để xem lý do
4. Giáo viên sửa lại qua `PATCH /api/courses/:id`
5. Submit lại qua `PATCH /api/courses/:id/submit` → `status = pending`
6. Quy trình phê duyệt lặp lại từ bước 4 ở phần III
