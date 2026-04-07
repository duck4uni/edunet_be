# EduNet - Thiết Kế Luồng Học Tập (Learning Flow Design)

## Tổng Quan Kiến Trúc

### Các Role trong Hệ Thống
| Role | Mô tả |
|------|--------|
| **Student** | Đăng ký khóa học, học tập, làm bài tập/quiz |
| **Teacher** | Tạo khóa học, quản lý nội dung, chấm điểm |
| **Admin** | Duyệt khóa học, quản lý toàn bộ hệ thống |

---

## 1. Luồng Đăng Ký & Duyệt Khóa Học

### 1.1. Giảng Viên Tạo Khóa Học
```
Teacher tạo khóa → status: DRAFT
    ↓
Teacher thêm nội dung (lessons, materials, assignments, quizzes)
    ↓
Teacher submit → status: PENDING
    ↓
Admin duyệt → status: APPROVED → PUBLISHED (tự động)
    hoặc
Admin từ chối → status: REJECTED (kèm lý do)
```

**Entities liên quan**: `Course` (CourseStatus enum)

### 1.2. Học Viên Đăng Ký Khóa Học
```
Student xem khóa học (status: PUBLISHED)
    ↓
Student nhấn "Đăng ký" → POST /enrollments/enroll
    ↓
Enrollment tạo mới → status: PENDING
    ↓
Teacher/Admin duyệt → PATCH /enrollments/:id/approve → status: ACTIVE
    hoặc
Teacher/Admin từ chối → PATCH /enrollments/:id/reject → status: REJECTED
```

**Endpoints**:
- `POST /enrollments/enroll` — Student đăng ký (chỉ cần courseId)
- `GET /enrollments/check/:courseId` — Kiểm tra trạng thái đăng ký
- `PATCH /enrollments/:id/approve` — Duyệt enrollment
- `PATCH /enrollments/:id/reject` — Từ chối enrollment

---

## 2. Luồng Quản Lý Nội Dung (Teacher)

### 2.1. Quản Lý Bài Học (Lessons)
- CRUD: Tạo/Sửa/Xóa bài học
- Sắp xếp thứ tự (`order`)
- Phân loại: VIDEO / READING / QUIZ / ASSIGNMENT
- **Hiển thị/Ẩn** (`isVisible`): Teacher toggle hiển thị cho học viên

### 2.2. Quản Lý Tài Liệu (Materials)
- CRUD: Tạo/Sửa/Xóa tài liệu
- Phân loại: PDF / VIDEO / DOCUMENT / LINK / IMAGE
- **Hiển thị/Ẩn** (`isVisible`): Teacher toggle hiển thị cho học viên

### 2.3. Quản Lý Bài Tập (Assignments)
- CRUD: Tạo/Sửa/Xóa bài tập
- Thiết lập: tiêu đề, mô tả, hạn nộp (`dueDate`), điểm tối đa (`maxGrade`)
- **Hiển thị/Ẩn** (`isVisible`): Teacher toggle hiển thị cho học viên
- Chấm điểm: `POST /assignments/:id/grade` (grade + feedback)

### 2.4. Quản Lý Quiz
- CRUD: Tạo/Sửa/Xóa quiz
- Thiết lập: thời gian, số câu, điểm đạt, số lần thi tối đa
- Quản lý câu hỏi (JSONB): thêm/xóa/sửa câu hỏi + đáp án
- **Hiển thị/Ẩn** (`isVisible`): Teacher toggle hiển thị cho học viên

---

## 3. Luồng Học Tập (Student)

### 3.1. Truy Cập Lớp Học
```
Student đã enrolled (status: ACTIVE)
    ↓
Xem danh sách bài học (chỉ isVisible = true)
    ↓
Xem tài liệu (chỉ isVisible = true)
    ↓
Làm bài tập / Quiz (chỉ isVisible = true)
```

### 3.2. Nộp Bài Tập
```
Student xem bài tập → GET /assignments/course/:courseId
    ↓
Student nộp bài → POST /assignments/:id/submit (submissionUrl)
    ↓
Assignment status → SUBMITTED
    ↓
Teacher chấm điểm → POST /assignments/:id/grade
    ↓
Assignment status → GRADED (grade + feedback)
```

### 3.3. Làm Quiz
```
Student chọn Quiz → GET /quizzes/:id
    ↓
Bắt đầu làm → POST /quizzes/:id/start → tạo QuizAttempt
    ↓
Làm bài (tính thời gian)
    ↓
Nộp bài → POST /quizzes/attempts/:attemptId/submit
    ↓
Xem kết quả → GET /quizzes/attempts/:attemptId
    ↓
Xem best score → GET /quizzes/:id/best-score
```

### 3.4. Theo Dõi Tiến Độ
- `GET /quizzes/course/:courseId/my-progress` — Lấy tiến độ quiz (attempts, bestScore, status)
- `PATCH /enrollments/:id/progress` — Cập nhật tiến độ enrollment
- Khi progress >= 100% → `enrollment.status = COMPLETED`

---

## 4. Quản Lý Lớp Học (Classroom)

### 4.1. Teacher Quản Lý Thành Viên
| Hành động | API | Mô tả |
|-----------|-----|--------|
| Xem danh sách | `GET /enrollments/course/:courseId` | Danh sách thành viên + trạng thái |
| Duyệt | `PATCH /enrollments/:id/approve` | Duyệt học viên chờ |
| Từ chối | `PATCH /enrollments/:id/reject` | Từ chối học viên |
| Xóa | `DELETE /enrollments/:id` | Xóa khỏi lớp |
| Cập nhật tiến độ | `PATCH /enrollments/:id/progress` | Điều chỉnh progress |

### 4.2. Trạng Thái Thành Viên
- **Chờ duyệt** (pending): Mới đăng ký, chờ teacher/admin duyệt → Hiện nút Duyệt/Từ chối
- **Hoạt động** (active): Đã được duyệt, đang học
- **Không hoạt động** (inactive): Đã dropped/expired/rejected

---

## 5. Visibility Control (Kiểm Soát Hiển Thị)

### 5.1. Cơ Chế
Tất cả nội dung học tập (Lesson, Material, Assignment, Quiz) có trường `isVisible: boolean` (default: `true`).

- **Teacher**: Thấy TẤT CẢ nội dung + toggle Switch Hiện/Ẩn
- **Student**: Chỉ thấy nội dung có `isVisible = true`

### 5.2. API
- Teacher gọi API không có `?visibleOnly=true` → thấy tất cả
- Student gọi API với `?visibleOnly=true` → chỉ thấy nội dung hiển thị

### 5.3. Các Endpoint Hỗ Trợ
| Endpoint | Query Param | Mô tả |
|----------|-------------|--------|
| `GET /lessons/course/:courseId` | `?visibleOnly=true` | Lọc bài học hiển thị |
| `GET /materials/course/:courseId` | `?visibleOnly=true` | Lọc tài liệu hiển thị |
| `GET /assignments/course/:courseId` | `?visibleOnly=true` | Lọc bài tập hiển thị |
| `GET /quizzes/course/:courseId` | `?visibleOnly=true` | Lọc quiz hiển thị |

---

## 6. Sơ Đồ Database (Entity Relationships)

```
Course (1) ──────── (N) Lesson         [isVisible, order, type]
Course (1) ──────── (N) Material       [isVisible, type, downloadUrl]
Course (1) ──────── (N) Assignment     [isVisible, dueDate, grade, status]
Course (1) ──────── (N) Quiz           [isVisible, questions JSONB]
Course (1) ──────── (N) Enrollment     [status, progress]
Course (1) ──────── (N) Review         [rating, comment]
Course (N) ──────── (1) User/Teacher   [teacherId]
Course (N) ──────── (1) Category       [categoryId]

Quiz (1) ────────── (N) QuizAttempt    [answers, score, status]
Enrollment (N) ──── (1) User/Student   [userId]
```

---

## 7. Migration Áp Dụng

**File**: `1775520006000-AddIsVisibleToLearningEntities.ts`

```sql
ALTER TABLE "Lessons"     ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true;
ALTER TABLE "Materials"   ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true;
ALTER TABLE "Assignments" ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true;
ALTER TABLE "Quizzes"     ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true;
```

---

## 8. Tóm Tắt Thay Đổi Đã Thực Hiện

### Backend (NestJS)
| File | Thay đổi |
|------|----------|
| `lesson/entities/lesson.entity.ts` | Thêm `isVisible: boolean` |
| `material/entities/material.entity.ts` | Thêm `isVisible: boolean` |
| `assignment/entities/assignment.entity.ts` | Thêm `isVisible: boolean` |
| `quiz/entities/quiz.entity.ts` | Thêm `isVisible: boolean` |
| `*/dto/create-*.dto.ts` | Thêm `isVisible?: boolean` validator |
| `*/service.ts` | `findByCourse()` hỗ trợ `visibleOnly` param |
| `*/controller.ts` | `findByCourse()` nhận `?visibleOnly` query |
| `quiz/quiz.service.ts` | Thêm `getMyProgress()` method |
| `quiz/quiz.controller.ts` | Thêm `GET course/:courseId/my-progress` |
| Migration | `1775520006000-AddIsVisibleToLearningEntities.ts` |

### Frontend (React + RTK Query)
| File | Thay đổi |
|------|----------|
| `services/learningApi.ts` | Thêm `isVisible` vào interfaces + `getMyQuizProgress` endpoint |
| `services/courseApi.ts` | Thêm `isVisible` vào Lesson interface |
| `types/myCourse.ts` | Thêm `'pending'` vào ClassMember.status |
| `hooks/useQuiz.ts` | Fetch real quiz progress (attempts, bestScore, status) |
| `hooks/useClassroom.ts` | Wire real approve/reject/delete enrollment APIs |
| `ManageCourse/ClassroomTab.tsx` | Thêm visibility Switch toggle |
| `ManageCourse/MaterialsTab.tsx` | Thêm visibility Switch toggle |
| `ManageCourse/AssignmentsTab.tsx` | Thêm visibility Switch toggle |
| `ManageCourse/QuizzesTab.tsx` | Thêm visibility Switch toggle |
| `Classroom/index.tsx` | Hiện trạng thái "Chờ duyệt" + nút Duyệt/Từ chối |
