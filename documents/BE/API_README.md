# EduNet Backend API README

Tai lieu nay tong hop toan bo API endpoint hien co trong backend, kem payload va response cho tung endpoint.

## 1) Thong Tin Chung

- Base URL local: `http://127.0.0.1:3000`
- API prefix: `/api`
- Swagger: `/docs`
- Auth header (neu endpoint yeu cau):

```http
Authorization: Bearer <access_token>
```

## 2) Cau Truc Response Chuan

Hau het endpoint tra ve `CommonResponse<T>`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {}
}
```

Khi loi, service throw `HttpException` (khong theo khuon `success: false` tu object return), vi du:

```json
{
  "statusCode": 404,
  "message": "Course not found"
}
```

Kieu pagination dung chung:

```ts
PaginationResponseInterface<T> = {
  rows: T[];
  count: number;
}
```

## 3) Query Params Dung Chung

Cac endpoint list (findAll) dung bo query sau:

- Pagination: `?page=1&size=10` (ho tro `size=unlimited`)
- Sorting: `?sort=field:asc&&field2:desc`
- Filtering: `?filter=field:rule:value&&field2:rule:value`
- Include relations: `?include=relation1|relation2`

Rule filter ho tro: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `nlike`, `in`, `nin`, `isnull`, `isnotnull`.

## 4) Payload Schemas

### 4.1 Auth

- `LoginDto`
  - `email: string` (required, email)
  - `password: string` (required, min 6)
- `RegisterDto`
  - `firstName: string` (required)
  - `lastName?: string`
  - `email: string` (required, email)
  - `password: string` (required, min 6)
  - `phone?: string`
  - `role?: 'admin' | 'teacher' | 'student'`
- `RegisterTeacherDto` (multipart form-data)
  - `firstName: string` (required)
  - `lastName?: string`
  - `email: string` (required, email)
  - `password: string` (required, min 6)
  - `phone?: string`
  - `qualification?: string`
  - `experience?: number`
  - `bio?: string`
  - `cv: File` (required, PDF only, max 5MB)
- `RefreshTokenBody`
  - `refreshToken: string` (required)
- `LogoutBody`
  - `refreshToken: string` (required)
- `ForgotPasswordBody`
  - `email: string` (required)
- `ResetPasswordBody`
  - `token: string` (required)
  - `password: string` (required)

### 4.2 User

- `UpdateUserDto`
  - `firstName?: string`
  - `lastName?: string`
  - `phone?: string`
  - `avatar?: string`
  - `bio?: string`
  - `dateOfBirth?: string` (date)
  - `gender?: 'male' | 'female' | 'other'`
  - `address?: string`
  - `city?: string`
  - `country?: string`
  - `isActive?: boolean`

### 4.3 Category

- `CreateCategoryDto`
  - `name: string` (required)
  - `description?: string`
  - `image?: string`
  - `slug?: string`
  - `order?: number`
  - `isActive?: boolean`
- `UpdateCategoryDto = Partial<CreateCategoryDto>`

### 4.4 Course

- `CreateCourseDto`
  - `title: string` (required)
  - `description?: string`
  - `thumbnail?: string`
  - `price?: number`
  - `discountPrice?: number`
  - `duration?: string`
  - `level?: 'beginner' | 'intermediate' | 'advanced' | 'all'`
  - `language?: string`
  - `tags?: string[]`
  - `goal?: string`
  - `schedule?: string[]`
  - `startDate?: string` (date)
  - `categoryId?: uuid`
  - `teacherId: uuid` (required)
- `UpdateCourseDto = Partial<CreateCourseDto>`
- `UpdateCourseStatusDto`
  - `status: 'approved' | 'rejected'` (required)
  - `feedback?: string` (optional, for rejection reason)

### 4.5 Lesson

- `CreateLessonDto`
  - `title: string` (required)
  - `description?: string`
  - `type?: 'video' | 'reading' | 'quiz' | 'assignment'`
  - `content?: string`
  - `videoUrl?: string`
  - `duration?: string`
  - `order?: number`
  - `isFree?: boolean`
  - `courseId: uuid` (required)
- `UpdateLessonDto = Partial<CreateLessonDto>`

### 4.6 Material

- `CreateMaterialDto`
  - `title: string` (required)
  - `description?: string`
  - `type?: 'pdf' | 'video' | 'document' | 'link' | 'image'`
  - `downloadUrl: string` (required)
  - `size?: string`
  - `courseId: uuid` (required)
- `UpdateMaterialDto = Partial<CreateMaterialDto>`

### 4.7 Assignment

- `CreateAssignmentDto`
  - `title: string` (required)
  - `description?: string`
  - `dueDate: string` (required, date)
  - `status?: 'pending' | 'submitted' | 'graded' | 'overdue'`
  - `grade?: number`
  - `maxGrade?: number`
  - `attachments?: object`
  - `feedback?: string`
  - `submissionUrl?: string`
  - `courseId: uuid` (required)
  - `studentId?: uuid`
- `UpdateAssignmentDto = Partial<CreateAssignmentDto>`
- `SubmitAssignmentBody`
  - `submissionUrl: string` (required)
- `GradeAssignmentBody`
  - `grade: number` (required)
  - `feedback?: string`

### 4.8 Quiz

- `CreateQuizDto`
  - `title: string` (required)
  - `description?: string`
  - `duration?: number`
  - `questions?: any[]`
  - `totalQuestions?: number`
  - `maxAttempts?: number`
  - `passingScore?: number`
  - `shuffleQuestions?: boolean`
  - `showCorrectAnswers?: boolean`
  - `courseId: uuid` (required)
- `UpdateQuizDto = Partial<CreateQuizDto>`
- `SubmitAttemptBody`
  - `answers: object` (required)
  - `score: number` (required)
  - `correctAnswers: number` (required)

### 4.9 Review

- `CreateReviewDto`
  - `rating: number` (required, 1..5)
  - `comment?: string`
  - `courseId: uuid` (required)
- `UpdateReviewDto = Partial<CreateReviewDto>`

### 4.10 Enrollment

- `CreateEnrollmentDto`
  - `userId: uuid` (required)
  - `courseId: uuid` (required)
  - `progress?: number`
  - `status?: 'active' | 'completed' | 'dropped' | 'expired'`
- `UpdateEnrollmentDto = Partial<CreateEnrollmentDto>`
- `EnrollBody`
  - `courseId: uuid` (required)
- `UpdateProgressBody`
  - `progress: number` (required)

### 4.11 Schedule

- `CreateScheduleDto`
  - `title: string` (required)
  - `description?: string`
  - `type?: 'class' | 'exam' | 'assignment' | 'event'`
  - `date: string` (required, date)
  - `startTime: string` (required)
  - `endTime: string` (required)
  - `location?: string`
  - `meetingLink?: string`
  - `isOnline?: boolean`
  - `courseId?: uuid`
  - `teacherId?: uuid`
- `UpdateScheduleDto = Partial<CreateScheduleDto>`

### 4.12 Teacher

- `CreateTeacherDto`
  - `userId: uuid` (required)
  - `specialization?: string[]`
  - `qualification?: string`
  - `experience?: number`
  - `status?: string`
  - `bio?: string`
  - `socialLinks?: { linkedin?: string; twitter?: string; website?: string }`
- `UpdateTeacherDto = Partial<CreateTeacherDto>`
- `RejectTeacherDto`
  - `reason?: string` (optional, rejection reason)

### 4.13 Student

- `CreateStudentDto`
  - `userId: uuid` (required)
  - `school?: string`
  - `grade?: string`
- `UpdateStudentDto = Partial<CreateStudentDto>`

### 4.14 Support Ticket

- `CreateSupportTicketDto`
  - `subject: string` (required)
  - `message: string` (required)
  - `priority?: 'low' | 'medium' | 'high' | 'urgent'`
  - `category?: 'technical' | 'billing' | 'course' | 'account' | 'other'`
  - `attachments?: object`
- `UpdateSupportTicketDto`
  - `subject?: string`
  - `message?: string`
  - `priority?: 'low' | 'medium' | 'high' | 'urgent'`
  - `category?: 'technical' | 'billing' | 'course' | 'account' | 'other'`
  - `attachments?: object`
  - `status?: 'open' | 'in_progress' | 'resolved' | 'closed'`
  - `assignedToId?: uuid`
- `RespondTicketBody`
  - `response: string` (required)
  - `assignedToId?: uuid`

## 5) Danh Sach Toan Bo Endpoints

Ghi chu:

- Cot `Payload` gom body + params + query neu co.
- Cot `Response` la kieu `data` trong `CommonResponse<T>`, truu truong hop ghi ro endpoint tra ve raw.

### 5.1 App

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| GET | `/api` | No | - | raw `string` (`EduNet Backend API v1.0`) |
| GET | `/api/health` | No | - | raw `{ status: string; timestamp: string }` |

### 5.2 Auth

| Method | Endpoint | Auth | Payload | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | No | body: `LoginDto` | `CommonResponse<{ user: User; accessToken: string; refreshToken: string }>` | - |
| POST | `/api/auth/register` | No | body: `RegisterDto` | `CommonResponse<{ user: User; accessToken: string; refreshToken: string }>` | - |
| POST | `/api/auth/register/teacher` | No | body: `RegisterTeacherDto` (multipart) + file: `cv` (PDF, max 5MB) | `CommonResponse<{ message: string }>` | Teacher account requires admin approval |
| GET | `/api/auth/profile` | Yes | - | `CommonResponse<User>` | Get current user profile |
| POST | `/api/auth/refresh` | No | body: `refreshToken: string` | `CommonResponse<{ accessToken: string }>` | Refresh access token |
| POST | `/api/auth/logout` | Yes | body: `refreshToken: string` | `CommonResponse<{ message: string }>` | - |
| POST | `/api/auth/forgot-password` | No | body: `email: string` | `CommonResponse<{ message: string }>` | Send reset link to email |
| POST | `/api/auth/reset-password` | No | body: `token: string, password: string` | `CommonResponse<{ message: string }>` | - |

### 5.3 Users

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| GET | `/api/users` | Yes | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<User>>` |
| GET | `/api/users/:id` | Yes | params: `id` | `CommonResponse<User>` |
| PATCH | `/api/users/:id` | Yes | params: `id`, body: `UpdateUserDto` | `CommonResponse<User>` |
| DELETE | `/api/users/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.4 Categories

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/categories` | Yes | body: `CreateCategoryDto` | `CommonResponse<Category>` |
| GET | `/api/categories` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Category>>` |
| GET | `/api/categories/:id` | No | params: `id` | `CommonResponse<Category>` |
| PATCH | `/api/categories/:id` | Yes | params: `id`, body: `UpdateCategoryDto` | `CommonResponse<Category>` |
| DELETE | `/api/categories/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.5 Courses

| Method | Endpoint | Auth | Payload | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/courses` | Yes (Teacher/Admin) | body: `CreateCourseDto` | `CommonResponse<Course>` | Teacher: status→`pending`; Admin: status→`published` |
| GET | `/api/courses` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Course>>` | Students see published only |
| GET | `/api/courses/:id` | No | params: `id`, query: `include` (optional) | `CommonResponse<Course>` | - |
| PATCH | `/api/courses/:id` | Yes (Teacher/Admin) | params: `id`, body: `UpdateCourseDto` | `CommonResponse<Course>` | Teacher updates own draft/rejected; Admin updates any |
| PATCH | `/api/courses/:id/submit` | Yes (Teacher) | params: `id` | `CommonResponse<Course>` | Submit draft/rejected course for review (status→`pending`) |
| PATCH | `/api/courses/:id/review` | Yes (Admin) | params: `id`, body: `UpdateCourseStatusDto` | `CommonResponse<Course>` | Admin approves/rejects pending course |
| PATCH | `/api/courses/:id/publish` | Yes (Admin) | params: `id` | `CommonResponse<Course>` | Publish approved course (status→`published`) |
| DELETE | `/api/courses/:id` | Yes (Teacher/Admin) | params: `id` | `CommonResponse<{ message: string }>` | - |

### 5.6 Lessons

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/lessons` | Yes | body: `CreateLessonDto` | `CommonResponse<Lesson>` |
| GET | `/api/lessons` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Lesson>>` |
| GET | `/api/lessons/:id` | No | params: `id` | `CommonResponse<Lesson>` |
| GET | `/api/lessons/course/:courseId` | No | params: `courseId` | `CommonResponse<Lesson[]>` |
| PATCH | `/api/lessons/:id` | Yes | params: `id`, body: `UpdateLessonDto` | `CommonResponse<Lesson>` |
| DELETE | `/api/lessons/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.7 Materials

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/materials` | Yes | body: `CreateMaterialDto` | `CommonResponse<Material>` |
| GET | `/api/materials` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Material>>` |
| GET | `/api/materials/:id` | No | params: `id` | `CommonResponse<Material>` |
| GET | `/api/materials/course/:courseId` | No | params: `courseId` | `CommonResponse<Material[]>` |
| PATCH | `/api/materials/:id` | Yes | params: `id`, body: `UpdateMaterialDto` | `CommonResponse<Material>` |
| DELETE | `/api/materials/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.8 Assignments

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/assignments` | Yes | body: `CreateAssignmentDto` | `CommonResponse<Assignment>` |
| GET | `/api/assignments` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Assignment>>` |
| GET | `/api/assignments/:id` | No | params: `id` | `CommonResponse<Assignment>` |
| GET | `/api/assignments/student/:studentId` | Yes | params: `studentId` | `CommonResponse<Assignment[]>` |
| GET | `/api/assignments/course/:courseId` | No | params: `courseId` | `CommonResponse<Assignment[]>` |
| PATCH | `/api/assignments/:id` | Yes | params: `id`, body: `UpdateAssignmentDto` | `CommonResponse<Assignment>` |
| POST | `/api/assignments/:id/submit` | Yes | params: `id`, body: `SubmitAssignmentBody` | `CommonResponse<Assignment>` |
| POST | `/api/assignments/:id/grade` | Yes | params: `id`, body: `GradeAssignmentBody` | `CommonResponse<Assignment>` |
| DELETE | `/api/assignments/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.9 Quizzes

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/quizzes` | Yes | body: `CreateQuizDto` | `CommonResponse<Quiz>` |
| GET | `/api/quizzes` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Quiz>>` |
| GET | `/api/quizzes/:id` | No | params: `id` | `CommonResponse<Quiz>` |
| GET | `/api/quizzes/course/:courseId` | No | params: `courseId` | `CommonResponse<Quiz[]>` |
| PATCH | `/api/quizzes/:id` | Yes | params: `id`, body: `UpdateQuizDto` | `CommonResponse<Quiz>` |
| DELETE | `/api/quizzes/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |
| POST | `/api/quizzes/:id/start` | Yes | params: `id` | `CommonResponse<QuizAttempt>` |
| POST | `/api/quizzes/attempts/:attemptId/submit` | Yes | params: `attemptId`, body: `SubmitAttemptBody` | `CommonResponse<QuizAttempt>` |
| GET | `/api/quizzes/attempts/:attemptId` | Yes | params: `attemptId` | `CommonResponse<QuizAttempt>` |
| GET | `/api/quizzes/:id/attempts` | Yes | params: `id` | `CommonResponse<QuizAttempt[]>` |
| GET | `/api/quizzes/:id/best-score` | Yes | params: `id` | `CommonResponse<{ bestScore: number }>` |

### 5.10 Reviews

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/reviews` | Yes | body: `CreateReviewDto` | `CommonResponse<Review>` |
| GET | `/api/reviews` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Review>>` |
| GET | `/api/reviews/:id` | No | params: `id` | `CommonResponse<Review>` |
| GET | `/api/reviews/course/:courseId` | No | params: `courseId` | `CommonResponse<Review[]>` |
| GET | `/api/reviews/course/:courseId/stats` | No | params: `courseId` | `CommonResponse<{ averageRating: number; totalReviews: number }>` |
| PATCH | `/api/reviews/:id` | Yes | params: `id`, body: `UpdateReviewDto` | `CommonResponse<Review>` |
| DELETE | `/api/reviews/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |
| PATCH | `/api/reviews/:id/toggle-visibility` | Yes | params: `id` | `CommonResponse<Review>` |

### 5.11 Enrollments

> **Course enrollment flow:** When student enrolls (`POST /enroll`), enrollment is created with `status: pending`. Teacher/Admin approves via `PATCH /:id/approve` → status changes to `active`. Reject via `PATCH /:id/reject` → status changes to `rejected`.

| Method | Endpoint | Auth | Payload | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/enrollments` | Yes | body: `CreateEnrollmentDto` | `CommonResponse<Enrollment>` | Direct enrollment create |
| POST | `/api/enrollments/enroll` | Yes | body: `courseId: string` | `CommonResponse<Enrollment>` | Enroll current user in course (status=`pending`) |
| GET | `/api/enrollments/my-enrollments` | Yes | - | `CommonResponse<Enrollment[]>` | Get all enrollments of current user with course details |
| GET | `/api/enrollments/check/:courseId` | Yes | params: `courseId` | `CommonResponse<{ enrolled: boolean; isPending: boolean; enrollment: Enrollment \| null }>` | Check enrollment status for course |
| GET | `/api/enrollments` | Yes | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Enrollment>>` | - |
| GET | `/api/enrollments/course/:courseId` | Yes | params: `courseId` | `CommonResponse<Enrollment[]>` | Get all students enrolled in course |
| GET | `/api/enrollments/:id` | Yes | params: `id` | `CommonResponse<Enrollment>` | - |
| GET | `/api/enrollments/user/:userId` | Yes | params: `userId` | `CommonResponse<Enrollment[]>` | Get all enrollments for specific user |
| PATCH | `/api/enrollments/:id/approve` | Yes | params: `id` | `CommonResponse<Enrollment>` | Approve enrollment (status→`active`) |
| PATCH | `/api/enrollments/:id/reject` | Yes | params: `id` | `CommonResponse<Enrollment>` | Reject enrollment (status→`rejected`) |
| PATCH | `/api/enrollments/:id` | Yes | params: `id`, body: `UpdateEnrollmentDto` | `CommonResponse<Enrollment>` | Update enrollment details |
| PATCH | `/api/enrollments/:id/progress` | Yes | params: `id`, body: `progress: number` | `CommonResponse<Enrollment>` | Update student progress |
| DELETE | `/api/enrollments/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` | - |

### 5.12 Schedules

| Method | Endpoint | Auth | Payload | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/schedules` | Yes (Teacher/Admin) | body: `CreateScheduleDto` | `CommonResponse<Schedule>` | Create single schedule |
| GET | `/api/schedules` | No | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Schedule>>` | List all schedules |
| GET | `/api/schedules/my` | Yes | - | `CommonResponse<Schedule[]>` | Student's personalized timetable based on active enrollments |
| GET | `/api/schedules/weekly` | No | query: `weekStart` (YYYY-MM-DD), `courseId?`, `teacherId?` | `CommonResponse<Schedule[]>` | Week view - group schedules by date for calendar UI |
| GET | `/api/schedules/upcoming` | No | query: `days?` (default 7) | `CommonResponse<Schedule[]>` | Upcoming schedules within N days |
| GET | `/api/schedules/date-range` | No | query: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD) | `CommonResponse<Schedule[]>` | Schedules between two dates |
| GET | `/api/schedules/:id` | No | params: `id` | `CommonResponse<Schedule>` | Get single schedule |
| GET | `/api/schedules/course/:courseId` | No | params: `courseId` | `CommonResponse<Schedule[]>` | All schedules for a course |
| GET | `/api/schedules/teacher/:teacherId` | Yes | params: `teacherId` | `CommonResponse<Schedule[]>` | All schedules assigned to teacher |
| PATCH | `/api/schedules/:id` | Yes | params: `id`, body: `UpdateScheduleDto` | `CommonResponse<Schedule>` | Update schedule |
| DELETE | `/api/schedules/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` | Delete schedule |

### 5.13 Teachers

| Method | Endpoint | Auth | Payload | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/teachers` | Yes (Admin) | body: `CreateTeacherDto` | `CommonResponse<Teacher>` | Create teacher profile (admin only) |
| GET | `/api/teachers` | Yes (Admin) | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Teacher>>` | List teachers (admin only) |
| GET | `/api/teachers/:id` | Yes | params: `id` | `CommonResponse<Teacher>` | Get teacher profile |
| PATCH | `/api/teachers/:id/approve` | Yes (Admin) | params: `id` | `CommonResponse<Teacher>` | Approve pending teacher registration - activates account |
| PATCH | `/api/teachers/:id/reject` | Yes (Admin) | params: `id`, body: `RejectTeacherDto` | `CommonResponse<Teacher>` | Reject pending teacher registration |
| PATCH | `/api/teachers/:id` | Yes (Admin/Teacher) | params: `id`, body: `UpdateTeacherDto` | `CommonResponse<Teacher>` | Update teacher profile |
| DELETE | `/api/teachers/:id` | Yes (Admin) | params: `id` | `CommonResponse<{ message: string }>` | - |

### 5.14 Students

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/students` | Yes | body: `CreateStudentDto` | `CommonResponse<Student>` |
| GET | `/api/students` | Yes | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<Student>>` |
| GET | `/api/students/:id` | Yes | params: `id` | `CommonResponse<Student>` |
| PATCH | `/api/students/:id` | Yes | params: `id`, body: `UpdateStudentDto` | `CommonResponse<Student>` |
| DELETE | `/api/students/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

### 5.15 Support Tickets

| Method | Endpoint | Auth | Payload | Response |
|---|---|---|---|---|
| POST | `/api/support-tickets` | Yes | body: `CreateSupportTicketDto` | `CommonResponse<SupportTicket>` |
| GET | `/api/support-tickets` | Yes | query: pagination/sort/filter/include | `CommonResponse<PaginationResponseInterface<SupportTicket>>` |
| GET | `/api/support-tickets/stats` | Yes | - | `CommonResponse<{ open: number; inProgress: number; resolved: number; closed: number }>` |
| GET | `/api/support-tickets/my-tickets` | Yes | - | `CommonResponse<SupportTicket[]>` |
| GET | `/api/support-tickets/status/:status` | Yes | params: `status` (`open \| in_progress \| resolved \| closed`) | `CommonResponse<SupportTicket[]>` |
| GET | `/api/support-tickets/:id` | Yes | params: `id` | `CommonResponse<SupportTicket>` |
| PATCH | `/api/support-tickets/:id` | Yes | params: `id`, body: `UpdateSupportTicketDto` | `CommonResponse<SupportTicket>` |
| POST | `/api/support-tickets/:id/respond` | Yes | params: `id`, body: `RespondTicketBody` | `CommonResponse<SupportTicket>` |
| POST | `/api/support-tickets/:id/resolve` | Yes | params: `id` | `CommonResponse<SupportTicket>` |
| POST | `/api/support-tickets/:id/close` | Yes | params: `id` | `CommonResponse<SupportTicket>` |
| DELETE | `/api/support-tickets/:id` | Yes | params: `id` | `CommonResponse<{ message: string }>` |

---

## 6) API Summary

- **Total Endpoints:** 117+
- **Protected Endpoints:** ~87 (74%)
- **Public Endpoints:** ~30 (26%)
- **Modules:** 15 (Auth, Users, Courses, Enrollments, Lessons, Materials, Assignments, Quizzes, Reviews, Schedules, Teachers, Students, Support Tickets, Categories, App)

## 7) Key Features & Workflows

### Course Approval Flow
1. Teacher creates course → status: `draft`
2. Teacher submits course → status: `pending`
3. Admin reviews via `PATCH /courses/:id/review` → status: `approved` or `rejected`
4. Admin publishes → status: `published`

### Enrollment Flow
1. Student enrolls via `POST /api/enrollments/enroll` → status: `pending`
2. Teacher/Admin approves via `PATCH /api/enrollments/:id/approve` → status: `active`
3. Or reject via `PATCH /api/enrollments/:id/reject` → status: `rejected`

### Teacher Registration Flow
1. User registers with CV via `POST /api/auth/register/teacher` → account status: `pending`
2. Admin approves via `PATCH /api/teachers/:id/approve` → account activated
3. Or reject via `PATCH /api/teachers/:id/reject` → account remains inactive

## 8) Notes for Frontend Integration

- Tất cả endpoints đều hỗ trợ quy chuẩn query params (pagination, sort, filter, include relations)
- Swagger documentation available tại `/docs`
- Các endpoint Protected yêu cầu Bearer token trong Authorization header
- Response structure luôn là `{ success: boolean, statusCode: number, data: T }`
- Error responses từ HttpException: `{ statusCode: number, message: string }`

---

Cập nhật theo source hiện tại trong controllers/services của dự án. 
Nếu cần thêm chi tiết, có thể tạo bản JSON/OpenAPI để FE import trực tiếp vào Postman.
