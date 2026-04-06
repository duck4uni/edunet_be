# Luồng Đăng Ký & Phê Duyệt Tài Khoản Giáo Viên (Teacher Registration Flow)

## I. Tổng Quan

Giáo viên muốn đăng ký tài khoản phải điền thông tin cá nhân, thông tin chuyên môn **và upload file CV dạng PDF**. Tài khoản **chưa được kích hoạt** cho đến khi admin xem xét và phê duyệt.

---

## II. Luồng Đầy Đủ

```
[Người đăng ký giáo viên]              [Admin]
           │                                │
           │ POST /api/auth/register/teacher│
           │ (multipart/form-data + CV PDF) │
           │────────────────────────────────►
           │                                │
           │ ← 201: "Registration submitted,│
           │         waiting for approval"  │
           │                                │
           │ [isActive = false]             │
           │ [teacher.status = "pending"]   │
           │                                │
           │              GET /api/teachers │
           │              ?filter=status:eq:pending
           │                        ◄───────│ Xem danh sách chờ duyệt
           │              [Xem CV PDF tại /uploads/cv/<filename>.pdf]
           │                                │
           │     ┌──────────────────────────┤ PATCH /api/teachers/:id/approve
           │     │                          │   → isActive = true
           │     │                          │   → teacher.status = "approved"
           │     │           [hoặc]         │
           │     │                          │ PATCH /api/teachers/:id/reject
           │     │                          │ { "rejectionReason": "..." }
           │     │                          │   → teacher.status = "rejected"
           │     │                          │
           │ [Approved]              [Rejected]
           │ Đăng nhập được          Tài khoản vẫn tồn tại
           │ POST /api/auth/login    nhưng isActive=false
```

---

## III. API Endpoints

### 1. Đăng ký tài khoản giáo viên

```http
POST /api/auth/register/teacher
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Bắt buộc | Mô tả |
|---|:---:|---|
| `firstName` | ✓ | Tên |
| `email` | ✓ | Email (phải unique) |
| `password` | ✓ | Mật khẩu (tối thiểu 6 ký tự) |
| `cv` | ✓ | File CV dạng PDF (tối đa 5MB) |
| `lastName` | | Họ |
| `phone` | | Số điện thoại |
| `qualification` | | Bằng cấp (vd: "Thạc sĩ CNTT") |
| `experience` | | Số năm kinh nghiệm |
| `bio` | | Giới thiệu bản thân |

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "message": "Registration submitted successfully. Please wait for admin approval."
  }
}
```

**Validation errors (422):**
```json
{
  "success": false,
  "errors": {
    "email": "Email has already been taken"
  }
}
```

**Lỗi thiếu CV (400):**
```json
{
  "success": false,
  "message": "CV file (PDF) is required for teacher registration"
}
```

**Lỗi sai định dạng file (400):**
```json
{
  "success": false,
  "message": "Only PDF files are allowed for CV upload"
}
```

---

### 2. Admin xem danh sách giáo viên chờ duyệt

```http
GET /api/teachers?filter=status:eq:pending&include=user
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "teacher-uuid",
        "teacherId": "TCH000001",
        "status": "pending",
        "qualification": "Thạc sĩ CNTT",
        "cvUrl": "/uploads/cv/abc123.pdf",
        "rejectionReason": null,
        "user": {
          "firstName": "Nguyen",
          "lastName": "Van A",
          "email": "teacher@example.com",
          "isActive": false,
          ...
        }
      }
    ],
    "count": 1
  }
}
```

---

### 3. Admin xem file CV

CV được serve dưới dạng static file:

```
GET /uploads/cv/<filename>.pdf
```

> Ví dụ: `GET /uploads/cv/abc123-uuid.pdf`

---

### 4. Admin phê duyệt đăng ký

```http
PATCH /api/teachers/:id/approve
Authorization: Bearer <admin-token>
```

**Kết quả:**
- `teacher.status` → `"approved"`
- `user.isActive` → `true`
- Giáo viên có thể đăng nhập được

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "teacher-uuid",
    "status": "approved",
    "rejectionReason": null,
    "user": {
      "isActive": true,
      ...
    }
  }
}
```

---

### 5. Admin từ chối đăng ký

```http
PATCH /api/teachers/:id/reject
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**
```json
{
  "rejectionReason": "CV không đúng yêu cầu, bằng cấp chưa được xác minh."
}
```

**Kết quả:**
- `teacher.status` → `"rejected"`
- `user.isActive` vẫn là `false`
- Giáo viên **không thể đăng nhập**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "teacher-uuid",
    "status": "rejected",
    "rejectionReason": "CV không đúng yêu cầu, bằng cấp chưa được xác minh.",
    ...
  }
}
```

---

### 6. Đăng nhập (bị chặn nếu chưa được duyệt)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Nếu chưa được duyệt (403):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Your account is pending approval. Please wait for admin review."
}
```

---

## IV. Phân Quyền

| Endpoint | Guest | Teacher | Admin |
|---|:---:|:---:|:---:|
| `POST /auth/register/teacher` | ✓ | | |
| `GET /teachers` | | | ✓ |
| `GET /teachers/:id` | | ✓ (own) | ✓ |
| `PATCH /teachers/:id/approve` | | | ✓ |
| `PATCH /teachers/:id/reject` | | | ✓ |
| `PATCH /teachers/:id` | | ✓ | ✓ |
| `DELETE /teachers/:id` | | | ✓ |

---

## V. Trạng Thái Của Teacher Profile

| `status` | `user.isActive` | Ý nghĩa |
|---|:---:|---|
| `pending` | `false` | Đang chờ admin xét duyệt |
| `approved` | `true` | Đã được duyệt, có thể đăng nhập |
| `rejected` | `false` | Bị từ chối |

---

## VI. File Upload — Cấu Hình

| Thuộc tính | Giá trị |
|---|---|
| Field name (form) | `cv` |
| Loại file cho phép | PDF only (`application/pdf`) |
| Kích thước tối đa | 5 MB |
| Thư mục lưu | `uploads/cv/` (project root) |
| URL truy cập | `/uploads/cv/<uuid>.pdf` |
| Tên file | UUID v4 + extension gốc |

---

## VII. Các File Đã Thay Đổi / Tạo Mới

| File | Thay đổi |
|---|---|
| `src/teacher/entities/teacher.entity.ts` | Thêm cột `cvUrl`, `rejectionReason` |
| `src/teacher/dto/reject-teacher.dto.ts` | **Mới** — DTO cho admin reject với lý do |
| `src/teacher/teacher.service.ts` | Thêm `approve()`, `reject()`; inject `UserRepository` |
| `src/teacher/teacher.module.ts` | Thêm `User` vào `forFeature` |
| `src/teacher/teacher.controller.ts` | Thêm `PATCH /:id/approve`, `PATCH /:id/reject`; gắn `RolesGuard` |
| `src/auth/dto/register-teacher.dto.ts` | **Mới** — DTO đăng ký giáo viên |
| `src/auth/dto/index.ts` | Export `RegisterTeacherDto` |
| `src/auth/auth.service.ts` | Thêm `registerTeacher()`; block login nếu `isActive=false` |
| `src/auth/auth.module.ts` | Thêm `Teacher` repo và `MulterModule` |
| `src/auth/auth.controller.ts` | Thêm `POST /register/teacher` với `FileInterceptor` |
| `src/core/config/upload.config.ts` | **Mới** — Cấu hình multer cho CV upload |
| `src/main.ts` | Thêm `useStaticAssets` để serve `uploads/` |
| `src/migrations/1775520002000-AddTeacherApprovalFields.ts` | **Mới** — Thêm `cvUrl`, `rejectionReason` vào DB |
| `uploads/cv/` | **Mới** — Thư mục lưu CV (tạo sẵn) |
