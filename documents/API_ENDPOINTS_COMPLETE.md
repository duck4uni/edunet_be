# EduNet Backend API Endpoints - Complete Reference

**Base URL:** `http://localhost:3000/api`

**Authentication:** Most endpoints require Bearer token in `Authorization` header: `Authorization: Bearer <accessToken>`

---

## Table of Contents
1. [App / Health](#app--health)
2. [Auth](#auth)
3. [Users](#users)
4. [Courses](#courses)
5. [Enrollments](#enrollments)
6. [Lessons](#lessons)
7. [Materials](#materials)
8. [Assignments](#assignments)
9. [Quizzes](#quizzes)
10. [Reviews](#reviews)
11. [Schedules](#schedules)
12. [Teachers](#teachers)
13. [Students](#students)
14. [Support Tickets](#support-tickets)
15. [Categories](#categories)

---

## App / Health

### GET / (Root)
- **Path:** `/`
- **Auth:** ❌ Not Required
- **Response:** `{ "message": "Hello World!" }`

### GET /health (Health Check)
- **Path:** `/health`
- **Auth:** ❌ Not Required
- **Response:** `{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }`

---

## Auth

**Base Path:** `/auth`

All auth endpoints use custom validation pipes for detailed error responses.

### POST /auth/login
- **Path:** `/auth/login`
- **Auth:** ❌ Not Required
- **Request Body (LoginDto):**
  - `email` (string, required): User's email
  - `password` (string, required): Password (min 6 chars)
- **Response:** `LoginResponse` (accessToken, refreshToken, user)

### POST /auth/register
- **Path:** `/auth/register`
- **Auth:** ❌ Not Required
- **Request Body (RegisterDto):**
  - `firstName` (string, required)
  - `lastName` (string, optional)
  - `email` (string, required, email format)
  - `password` (string, required, min 6 chars)
  - `phone` (string, optional)
  - `role` (enum, optional): `ADMIN`, `TEACHER`, `STUDENT` (defaults to STUDENT)
- **Response:** `LoginResponse` (accessToken, refreshToken, user)

### POST /auth/register/teacher
- **Path:** `/auth/register/teacher`
- **Auth:** ❌ Not Required
- **Content-Type:** `multipart/form-data`
- **Request Body (RegisterTeacherDto + file):**
  - **User Fields:**
    - `firstName` (string, required)
    - `lastName` (string, optional)
    - `email` (string, required, email format)
    - `password` (string, required, min 6 chars)
    - `phone` (string, optional)
  - **Teacher Profile Fields:**
    - `qualification` (string, optional)
    - `specialization` (array, optional)
    - `experience` (number, optional)
    - `bio` (string, optional)
  - **File:**
    - `cv` (file, required): PDF only, max 5MB
- **Response:** `{ "message": "Teacher registration submitted for approval" }`
- **Note:** Account requires admin approval before activation

### GET /auth/profile
- **Path:** `/auth/profile`
- **Auth:** ✅ **Required**
- **Response:** `Omit<User, 'password'>` - User object without password field

### POST /auth/refresh
- **Path:** `/auth/refresh`
- **Auth:** ❌ Not Required
- **Request Body:**
  - `refreshToken` (string, required)
- **Response:** `{ "accessToken": "new_jwt_token" }`

### POST /auth/logout
- **Path:** `/auth/logout`
- **Auth:** ✅ **Required**
- **Request Body:**
  - `refreshToken` (string, required)
- **Response:** `{ "success": true }`

### POST /auth/forgot-password
- **Path:** `/auth/forgot-password`
- **Auth:** ❌ Not Required
- **Request Body:**
  - `email` (string, required)
- **Response:** `{ "message": "Password reset email sent" }`

### POST /auth/reset-password
- **Path:** `/auth/reset-password`
- **Auth:** ❌ Not Required
- **Request Body:**
  - `token` (string, required): Reset token from email
  - `password` (string, required)
- **Response:** `{ "success": true }`

---

## Users

**Base Path:** `/users` | **Auth:** ✅ **All endpoints required**

Query Params for all list endpoints:
- `page` (number, default: 1)
- `size` (number, default: 10)
- `sort=field:asc&sort=field2:desc`
- `filter=field:eq:value&filter=field2:gt:value`
- `include=relation1|relation2`

### GET /users
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [User[], "count": number }`

### GET /users/:id
- **Path Param:** `id` (UUID)
- **Response:** `User`

### PATCH /users/:id
- **Path Param:** `id` (UUID)
- **Request Body (UpdateUserDto - all optional):**
  - `firstName` (string)
  - `lastName` (string)
  - `phone` (string)
  - `avatar` (string)
  - `bio` (string)
  - `dateOfBirth` (ISO date string)
  - `gender` (enum): `MALE`, `FEMALE`, `OTHER`
  - `address` (string)
  - `city` (string)
  - `country` (string)
  - `isActive` (boolean)
- **Response:** `User`

### DELETE /users/:id
- **Path Param:** `id` (UUID) - Soft delete
- **Response:** `{ "success": true }`

---

## Courses

**Base Path:** `/courses`

### POST /courses
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Request Body (CreateCourseDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `thumbnail` (string, optional) - URL
  - `price` (number, optional)
  - `discountPrice` (number, optional)
  - `duration` (string, optional) - e.g., "12 weeks"
  - `level` (enum, optional): `BEGINNER`, `INTERMEDIATE`, `ADVANCED`
  - `language` (string, optional)
  - `tags` (array, optional)
  - `goal` (string, optional)
  - `schedule` (array, optional)
  - `startDate` (ISO date string, optional)
  - `teacherId` (UUID, optional)
  - `categoryId` (UUID, optional)
- **Response:** `Course`
- **Status Flow:** Teacher creates → status: DRAFT/PENDING, Admin creates → status: PUBLISHED

### GET /courses
- **Auth:** ❌ Not Required (public, but limited by role)
- **Pagination, Sorting, Filtering, Relations Support**
- **Note:** Students see only PUBLISHED courses; Teachers/Admins see all
- **Response:** `{ "rows": [Course[], "count": number }`

### GET /courses/:id
- **Path Param:** `id` (UUID)
- **Auth:** ❌ Not Required
- **Response:** `Course`

### PATCH /courses/:id
- **Auth:** ✅ **Required** - Only course owner `TEACHER` or `ADMIN`
- **Request Body (UpdateCourseDto - all optional):** Same as CreateCourseDto
- **Response:** `Course`

### PATCH /courses/:id/submit
- **Auth:** ✅ **Required** - Only `TEACHER` (course owner)
- **Summary:** Submit draft/rejected course for admin review
- **Response:** `Course` (status → PENDING)

### PATCH /courses/:id/review
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Request Body (UpdateCourseStatusDto):**
  - `status` (enum, required): `APPROVED` or `REJECTED`
  - `rejectionReason` (string, optional)
- **Response:** `Course`

### PATCH /courses/:id/publish
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Summary:** Publish an approved course
- **Response:** `Course` (status → PUBLISHED)

### DELETE /courses/:id
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Response:** `{ "success": true }` (soft delete)

---

## Enrollments

**Base Path:** `/enrollments` | **Auth:** ✅ **All endpoints required**

### POST /enrollments
- **Request Body (CreateEnrollmentDto):**
  - `userId` (UUID, required)
  - `courseId` (UUID, required)
  - `progress` (number, optional, 0-100)
  - `status` (enum, optional): `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- **Response:** `Enrollment`

### POST /enrollments/enroll
- **Summary:** Shortcut to enroll current authenticated user
- **Request Body:**
  - `courseId` (UUID, required)
- **Response:** `Enrollment`

### GET /enrollments/my-enrollments
- **Summary:** Get all enrollments for current user with course details
- **Response:** `Enrollment[]`

### GET /enrollments/check/:courseId
- **Path Param:** `courseId` (UUID)
- **Summary:** Check if current user is enrolled
- **Response:** `{ "isEnrolled": boolean }`

### GET /enrollments
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Enrollment[], "count": number }`

### GET /enrollments/course/:courseId
- **Path Param:** `courseId` (UUID)
- **Summary:** Get all enrollments for a specific course
- **Response:** `Enrollment[]` (includes user details)

### GET /enrollments/:id
- **Path Param:** `id` (UUID)
- **Response:** `Enrollment`

### GET /enrollments/user/:userId
- **Path Param:** `userId` (UUID)
- **Response:** `Enrollment[]`

### PATCH /enrollments/:id
- **Path Param:** `id` (UUID)
- **Request Body (UpdateEnrollmentDto - all optional):** Same as CreateEnrollmentDto
- **Response:** `Enrollment`

### PATCH /enrollments/:id/approve
- **Path Param:** `id` (UUID)
- **Response:** `Enrollment` (status → ACTIVE)

### PATCH /enrollments/:id/reject
- **Path Param:** `id` (UUID)
- **Response:** `Enrollment` (status → CANCELLED)

### PATCH /enrollments/:id/progress
- **Path Param:** `id` (UUID)
- **Request Body:**
  - `progress` (number, required, 0-100)
- **Response:** `Enrollment`

### DELETE /enrollments/:id
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Lessons

**Base Path:** `/lessons`

### POST /lessons
- **Auth:** ✅ **Required**
- **Request Body (CreateLessonDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `type` (enum, optional): `VIDEO`, `TEXT`, `INTERACTIVE`
  - `content` (string, optional) - HTML/markdown
  - `videoUrl` (string, optional)
  - `duration` (string, optional) - e.g., "45 minutes"
  - `order` (number, optional) - Display order
  - `isFree` (boolean, optional, defaults to false)
  - `courseId` (UUID, required)
- **Response:** `Lesson`

### GET /lessons
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Lesson[], "count": number }`

### GET /lessons/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Lesson`

### GET /lessons/course/:courseId
- **Auth:** ❌ Not Required
- **Path Param:** `courseId` (UUID)
- **Response:** `Lesson[]`

### PATCH /lessons/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body (UpdateLessonDto - all optional):** Same as CreateLessonDto
- **Response:** `Lesson`

### DELETE /lessons/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Materials

**Base Path:** `/materials`

### POST /materials
- **Auth:** ✅ **Required**
- **Request Body (CreateMaterialDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `type` (enum, optional): `PDF`, `DOCUMENT`, `SPREADSHEET`, `PRESENTATION`, `VIDEO`, `CODE`, `OTHER`
  - `downloadUrl` (string, required)
  - `size` (string, optional) - e.g., "2.5MB"
  - `courseId` (UUID, required)
- **Response:** `Material`

### GET /materials
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Material[], "count": number }`

### GET /materials/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Material`

### GET /materials/course/:courseId
- **Auth:** ❌ Not Required
- **Path Param:** `courseId` (UUID)
- **Response:** `Material[]`

### PATCH /materials/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body (UpdateMaterialDto - all optional):** Same as CreateMaterialDto
- **Response:** `Material`

### DELETE /materials/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Assignments

**Base Path:** `/assignments`

### POST /assignments
- **Auth:** ✅ **Required**
- **Request Body (CreateAssignmentDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `dueDate` (ISO date string, required)
  - `status` (enum, optional): `PENDING`, `SUBMITTED`, `GRADED`
  - `grade` (number, optional)
  - `maxGrade` (number, optional) - max points
  - `attachments` (object, optional)
  - `feedback` (string, optional) - Teacher's feedback
  - `submissionUrl` (string, optional)
  - `courseId` (UUID, required)
  - `studentId` (UUID, optional)
- **Response:** `Assignment`

### GET /assignments
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Assignment[], "count": number }`

### GET /assignments/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Assignment`

### GET /assignments/student/:studentId
- **Auth:** ✅ **Required**
- **Path Param:** `studentId` (UUID)
- **Response:** `Assignment[]`

### GET /assignments/course/:courseId
- **Auth:** ❌ Not Required
- **Path Param:** `courseId` (UUID)
- **Response:** `Assignment[]`

### PATCH /assignments/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body (UpdateAssignmentDto - all optional):** Same as CreateAssignmentDto
- **Response:** `Assignment`

### POST /assignments/:id/submit
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body:**
  - `submissionUrl` (string, required)
- **Response:** `Assignment` (status → SUBMITTED)

### POST /assignments/:id/grade
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body:**
  - `grade` (number, required)
  - `feedback` (string, optional)
- **Response:** `Assignment` (status → GRADED)

### DELETE /assignments/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Quizzes

**Base Path:** `/quizzes`

### POST /quizzes
- **Auth:** ✅ **Required**
- **Request Body (CreateQuizDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `duration` (number, optional) - minutes
  - `questions` (array, optional) - Question objects
  - `totalQuestions` (number, optional)
  - `maxAttempts` (number, optional)
  - `passingScore` (number, optional) - %
  - `shuffleQuestions` (boolean, optional)
  - `showCorrectAnswers` (boolean, optional)
  - `courseId` (UUID, required)
- **Response:** `Quiz`

### GET /quizzes
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Quiz[], "count": number }`

### GET /quizzes/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Quiz`

### GET /quizzes/course/:courseId
- **Auth:** ❌ Not Required
- **Path Param:** `courseId` (UUID)
- **Response:** `Quiz[]`

### PATCH /quizzes/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body (UpdateQuizDto - all optional):** Same as CreateQuizDto
- **Response:** `Quiz`

### DELETE /quizzes/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

### POST /quizzes/:id/start
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Summary:** Start a quiz attempt for current user
- **Response:** `QuizAttempt` (attemptId, startedAt, etc.)

### POST /quizzes/attempts/:attemptId/submit
- **Auth:** ✅ **Required**
- **Path Param:** `attemptId` (UUID)
- **Request Body:**
  - `answers` (object, required) - question answers
  - `score` (number, required)
  - `correctAnswers` (number, required)
- **Response:** `QuizAttempt` (completed with results)

### GET /quizzes/attempts/:attemptId
- **Auth:** ✅ **Required**
- **Path Param:** `attemptId` (UUID)
- **Response:** `QuizAttempt`

### GET /quizzes/:id/attempts
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID) - Quiz ID
- **Summary:** Get all attempts by current user for a quiz
- **Response:** `QuizAttempt[]`

### GET /quizzes/:id/best-score
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID) - Quiz ID
- **Summary:** Get best score of current user
- **Response:** `{ "score": number, "percentage": number }`

---

## Reviews

**Base Path:** `/reviews` | **Auth:** ✅ **All endpoints required**

### POST /reviews
- **Request Body (CreateReviewDto):**
  - `rating` (number, required, 1-5)
  - `comment` (string, optional)
  - `courseId` (UUID, required)
- **Response:** `Review` (userId auto-filled from current user)

### GET /reviews
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Review[], "count": number }`

### GET /reviews/:id
- **Path Param:** `id` (UUID)
- **Response:** `Review`

### GET /reviews/course/:courseId
- **Path Param:** `courseId` (UUID)
- **Summary:** Get all reviews for a course
- **Response:** `Review[]`

### GET /reviews/course/:courseId/stats
- **Path Param:** `courseId` (UUID)
- **Summary:** Get course review statistics
- **Response:** `{ "avgRating": number, "totalReviews": number }`

### PATCH /reviews/:id
- **Path Param:** `id` (UUID)
- **Request Body (UpdateReviewDto - all optional):** Same as CreateReviewDto
- **Response:** `Review`

### DELETE /reviews/:id
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

### PATCH /reviews/:id/toggle-visibility
- **Path Param:** `id` (UUID)
- **Summary:** Toggle review visibility (public/private)
- **Response:** `Review`

---

## Schedules

**Base Path:** `/schedules`

### GET /schedules
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Schedule[], "count": number }`

### GET /schedules/my
- **Auth:** ✅ **Required**
- **Summary:** Student's personalized timetable based on active enrollments
- **Response:** `Schedule[]`

### GET /schedules/weekly
- **Auth:** ❌ Not Required
- **Query Params:**
  - `weekStart` (string, required): YYYY-MM-DD of the first day (Monday)
  - `courseId` (UUID, optional)
  - `teacherId` (UUID, optional)
- **Summary:** Week view - group schedules by date for calendar UI
- **Response:** `Schedule[]`

### GET /schedules/upcoming
- **Auth:** ❌ Not Required
- **Query Params:**
  - `days` (number, optional, default 7): Number of days to look ahead
- **Response:** `Schedule[]`

### GET /schedules/date-range
- **Auth:** ❌ Not Required
- **Query Params:**
  - `startDate` (string, required): YYYY-MM-DD
  - `endDate` (string, required): YYYY-MM-DD
- **Response:** `Schedule[]`

### GET /schedules/course/:courseId
- **Auth:** ❌ Not Required
- **Path Param:** `courseId` (UUID)
- **Response:** `Schedule[]`

### GET /schedules/teacher/:teacherId
- **Auth:** ❌ Not Required
- **Path Param:** `teacherId` (UUID)
- **Response:** `Schedule[]`

### GET /schedules/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Schedule`

### POST /schedules
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Request Body (CreateScheduleDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `type` (enum, optional): `CLASS`, `EXAM`, `TUTORIAL`, `MEETING`
  - `date` (ISO date string, required)
  - `startTime` (string, required): HH:mm format
  - `endTime` (string, required): HH:mm format
  - `location` (string, optional)
  - `meetingLink` (string, optional) - URL for online
  - `isOnline` (boolean, optional)
  - `courseId` (UUID, optional)
  - `teacherId` (UUID, optional)
- **Response:** `Schedule`

### POST /schedules/recurring
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Request Body (CreateRecurringScheduleDto):**
  - `title` (string, required)
  - `description` (string, optional)
  - `type` (enum, optional): `CLASS`, `EXAM`, `TUTORIAL`, `MEETING`
  - `startDate` (ISO date string, required): First date
  - `recurrenceEndDate` (ISO date string, required): End of recurrence
  - `weekDays` (array, required): [0-6] (0=Sunday, 1=Monday, etc.)
  - `startTime` (string, required): HH:mm format
  - `endTime` (string, required): HH:mm format
  - `location` (string, optional)
  - `meetingLink` (string, optional)
  - `isOnline` (boolean, optional)
  - `courseId` (UUID, optional)
  - `teacherId` (UUID, optional) - Admin only
- **Response:** `Schedule[]` (multiple schedules created)

### PATCH /schedules/:id/cancel
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Path Param:** `id` (UUID)
- **Request Body (CancelScheduleDto):**
  - `cancelReason` (string, optional)
- **Response:** `Schedule` (status → CANCELLED)

### PATCH /schedules/:id/postpone
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Path Param:** `id` (UUID)
- **Request Body (PostponeScheduleDto):**
  - `newDate` (ISO date string, required): YYYY-MM-DD
  - `newStartTime` (string, required): HH:mm format
  - `newEndTime` (string, required): HH:mm format
  - `notes` (string, optional)
- **Response:** `Schedule` (updated date/time)

### PATCH /schedules/:id
- **Auth:** ✅ **Required** - Only `TEACHER` or `ADMIN`
- **Path Param:** `id` (UUID)
- **Request Body (UpdateScheduleDto - all optional):** Same as CreateScheduleDto
- **Response:** `Schedule`

### DELETE /schedules/:id
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Path Param:** `id` (UUID)
- **Summary:** Hard-delete
- **Response:** `{ "success": true }`

---

## Teachers

**Base Path:** `/teachers`

### POST /teachers
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Request Body (CreateTeacherDto):**
  - `userId` (UUID, required)
  - `specialization` (array, optional)
  - `qualification` (string, optional)
  - `experience` (number, optional) - years
  - `status` (string, optional): `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`
  - `bio` (string, optional)
  - `socialLinks` (object, optional):
    - `linkedin` (string, optional)
    - `twitter` (string, optional)
    - `website` (string, optional)
- **Response:** `Teacher`

### GET /teachers
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Teacher[], "count": number }`

### GET /teachers/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `Teacher`

### PATCH /teachers/:id/approve
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Path Param:** `id` (UUID)
- **Summary:** Admin approves pending teacher registration - activates their account
- **Response:** `Teacher` (status → APPROVED)

### PATCH /teachers/:id/reject
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Path Param:** `id` (UUID)
- **Request Body (RejectTeacherDto):**
  - `rejectionReason` (string, required)
- **Response:** `Teacher` (status → REJECTED)

### PATCH /teachers/:id
- **Auth:** ✅ **Required** - `ADMIN` or own profile (TEACHER)
- **Path Param:** `id` (UUID)
- **Request Body (UpdateTeacherDto - all optional):** Same as CreateTeacherDto
- **Response:** `Teacher`

### DELETE /teachers/:id
- **Auth:** ✅ **Required** - Only `ADMIN`
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Students

**Base Path:** `/students` | **Auth:** ✅ **All endpoints required**

### POST /students
- **Request Body (CreateStudentDto):**
  - Field details vary by implementation
- **Response:** `Student`

### GET /students
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Student[], "count": number }`

### GET /students/:id
- **Path Param:** `id` (UUID)
- **Response:** `Student`

### PATCH /students/:id
- **Path Param:** `id` (UUID)
- **Request Body (UpdateStudentDto - all optional):** Same as CreateStudentDto
- **Response:** `Student`

### DELETE /students/:id
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Support Tickets

**Base Path:** `/support-tickets` | **Auth:** ✅ **All endpoints required**

### POST /support-tickets
- **Request Body (CreateSupportTicketDto):**
  - `subject` (string, required)
  - `message` (string, required)
  - `priority` (enum, optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  - `category` (enum, optional): `TECHNICAL`, `BILLING`, `COURSE_CONTENT`, `ACCOUNT`, `OTHER`
  - `attachments` (object, optional)
- **Response:** `SupportTicket` (userId auto-filled, status: OPEN)

### GET /support-tickets
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [SupportTicket[], "count": number }`

### GET /support-tickets/stats
- **Summary:** Get ticket statistics
- **Response:** `{ "totalTickets": number, "openTickets": number, ... }`

### GET /support-tickets/my-tickets
- **Summary:** Get tickets created by current user
- **Response:** `SupportTicket[]`

### GET /support-tickets/status/:status
- **Path Param:** `status` (enum): `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- **Response:** `SupportTicket[]`

### GET /support-tickets/:id
- **Path Param:** `id` (UUID)
- **Response:** `SupportTicket`

### PATCH /support-tickets/:id
- **Path Param:** `id` (UUID)
- **Request Body (UpdateSupportTicketDto - all optional):** Same as CreateSupportTicketDto
- **Response:** `SupportTicket`

### POST /support-tickets/:id/respond
- **Path Param:** `id` (UUID)
- **Request Body:**
  - `response` (string, required)
  - `assignedToId` (UUID, optional)
- **Response:** `SupportTicket` (status → IN_PROGRESS)

### POST /support-tickets/:id/resolve
- **Path Param:** `id` (UUID)
- **Response:** `SupportTicket` (status → RESOLVED)

### POST /support-tickets/:id/close
- **Path Param:** `id` (UUID)
- **Response:** `SupportTicket` (status → CLOSED)

### DELETE /support-tickets/:id
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Categories

**Base Path:** `/categories`

### POST /categories
- **Auth:** ✅ **Required**
- **Request Body (CreateCategoryDto):**
  - `name` (string, required)
  - `description` (string, optional)
  - `icon` (string, optional) - URL or icon identifier
  - `color` (string, optional) - hex color
- **Response:** `Category`

### GET /categories
- **Auth:** ❌ Not Required
- **Pagination, Sorting, Filtering, Relations Support**
- **Response:** `{ "rows": [Category[], "count": number }`

### GET /categories/:id
- **Auth:** ❌ Not Required
- **Path Param:** `id` (UUID)
- **Response:** `Category`

### PATCH /categories/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Request Body (UpdateCategoryDto - all optional):** Same as CreateCategoryDto
- **Response:** `Category`

### DELETE /categories/:id
- **Auth:** ✅ **Required**
- **Path Param:** `id` (UUID)
- **Response:** `{ "success": true }` (soft delete)

---

## Common Query String Patterns

All list endpoints (`GET /resources`) support these query parameters:

### Pagination
```
?page=1&size=10
```
- `page` (number, default: 1): Page number (1-indexed)
- `size` (number, default: 10): Items per page (or `unlimited` for all)

### Sorting
```
?sort=createdAt:desc&sort=title:asc
```
- `sort` (multiple): `field:asc` or `field:desc`
- Default: `createdAt:DESC`

### Filtering
```
?filter=title:like:web&filter=price:gte:100&filter=status:eq:published
```
- `filter` (multiple): `field:rule:value`
- **Rules:**
  - `eq` - equals
  - `neq` - not equals
  - `gt` - greater than
  - `gte` - greater than or equal
  - `lt` - less than
  - `lte` - less than or equal
  - `like` - contains (case-insensitive)
  - `nlike` - not contains
  - `in` - in array
  - `nin` - not in array
  - `isnull` - is null
  - `isnotnull` - not null

### Relations/Includes
```
?include=teacher|category|reviews
```
- `include` (pipe-separated): Load related entities
- Common: `teacher`, `category`, `course`, `user`, `reviews`, `enrollments`, etc.

### Full Example
```
GET /api/courses?page=1&size=20&sort=createdAt:desc&sort=title:asc&filter=level:eq:BEGINNER&filter=price:lte:100&include=teacher|category
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "field": "value"
  },
  "message": "Success message"
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "rows": [
      { "id": "uuid", ... }
    ],
    "count": 50
  },
  "message": "Success"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "errors": {
    "field": ["Error message 1", "Error message 2"]
  },
  "message": "Validation failed"
}
```

---

## Authentication

### Getting Tokens

1. **Register/Login** → Get `accessToken` and `refreshToken`
2. **Use in requests:** Add header
   ```
   Authorization: Bearer {accessToken}
   ```
3. **Token expires?** Call `/auth/refresh`
   ```
   POST /api/auth/refresh
   Body: { "refreshToken": "..." }
   ```

### Token Expiration
- **Access Token:** 1 hour (typical)
- **Refresh Token:** 7 days (typical)

### Logout
```
POST /api/auth/logout
Auth: Required
Body: { "refreshToken": "..." }
```

---

## Common Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate/constraint violation |
| 500 | Internal Server Error |

---

## Role-Based Access Control

| Endpoint Type | ADMIN | TEACHER | STUDENT |
|---|:---:|:---:|:---:|
| Create Course | ✅ | ✅ | ❌ |
| Publish Course | ✅ | ❌ | ❌ |
| Create Schedule | ✅ | ✅ | ❌ |
| Approve Teachers | ✅ | ❌ | ❌ |
| Enroll in Course | ✅ | ⚠️ | ✅ |
| View Profile | ✅ | ✅ | ✅ |
| Update Own Data | ✅ | ✅ | ✅ |

---

**Generated:** $(date)
**Backend Version:** NestJS 11 + TypeORM 0.3
**Last Updated:** 2026-04-06
