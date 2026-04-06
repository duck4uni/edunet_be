# EduNet Backend API - Quick Reference Summary

**Base URL:** `http://localhost:3000/api`

## All Endpoints at a Glance

| # | Module | HTTP | Endpoint | Auth | Purpose |
|---|--------|------|----------|------|---------|
| **APP / HEALTH** |
| 1 | App | GET | `/` | ❌ | Root health |
| 2 | App | GET | `/health` | ❌ | Health check |
| **AUTH** |
| 3 | Auth | POST | `/auth/login` | ❌ | User login |
| 4 | Auth | POST | `/auth/register` | ❌ | User registration |
| 5 | Auth | POST | `/auth/register/teacher` | ❌ | Teacher registration (with CV) |
| 6 | Auth | GET | `/auth/profile` | ✅ | Get current user profile |
| 7 | Auth | POST | `/auth/refresh` | ❌ | Refresh access token |
| 8 | Auth | POST | `/auth/logout` | ✅ | Logout & revoke token |
| 9 | Auth | POST | `/auth/forgot-password` | ❌ | Request password reset |
| 10 | Auth | POST | `/auth/reset-password` | ❌ | Reset password with token |
| **USERS** |
| 11 | Users | GET | `/users` | ✅ | List users (paginated) |
| 12 | Users | GET | `/users/:id` | ✅ | Get user by ID |
| 13 | Users | PATCH | `/users/:id` | ✅ | Update user |
| 14 | Users | DELETE | `/users/:id` | ✅ | Delete user |
| **COURSES** |
| 15 | Courses | POST | `/courses` | ✅ (TEACHER/ADMIN) | Create course |
| 16 | Courses | GET | `/courses` | ❌ | List courses (role-based) |
| 17 | Courses | GET | `/courses/:id` | ❌ | Get course details |
| 18 | Courses | PATCH | `/courses/:id` | ✅ (Owner/ADMIN) | Update course |
| 19 | Courses | PATCH | `/courses/:id/submit` | ✅ (TEACHER) | Submit for review |
| 20 | Courses | PATCH | `/courses/:id/review` | ✅ (ADMIN) | Approve/reject course |
| 21 | Courses | PATCH | `/courses/:id/publish` | ✅ (ADMIN) | Publish course |
| 22 | Courses | DELETE | `/courses/:id` | ✅ (Owner/ADMIN) | Delete course |
| **ENROLLMENTS** |
| 23 | Enrollments | POST | `/enrollments` | ✅ | Create enrollment |
| 24 | Enrollments | POST | `/enrollments/enroll` | ✅ | Enroll current user |
| 25 | Enrollments | GET | `/enrollments/my-enrollments` | ✅ | Get my enrollments |
| 26 | Enrollments | GET | `/enrollments/check/:courseId` | ✅ | Check if enrolled |
| 27 | Enrollments | GET | `/enrollments` | ✅ | List enrollments |
| 28 | Enrollments | GET | `/enrollments/course/:courseId` | ✅ | Get course enrollments |
| 29 | Enrollments | GET | `/enrollments/:id` | ✅ | Get enrollment |
| 30 | Enrollments | GET | `/enrollments/user/:userId` | ✅ | Get user enrollments |
| 31 | Enrollments | PATCH | `/enrollments/:id` | ✅ | Update enrollment |
| 32 | Enrollments | PATCH | `/enrollments/:id/approve` | ✅ | Approve enrollment |
| 33 | Enrollments | PATCH | `/enrollments/:id/reject` | ✅ | Reject enrollment |
| 34 | Enrollments | PATCH | `/enrollments/:id/progress` | ✅ | Update progress |
| 35 | Enrollments | DELETE | `/enrollments/:id` | ✅ | Delete enrollment |
| **LESSONS** |
| 36 | Lessons | POST | `/lessons` | ✅ | Create lesson |
| 37 | Lessons | GET | `/lessons` | ❌ | List lessons |
| 38 | Lessons | GET | `/lessons/:id` | ❌ | Get lesson |
| 39 | Lessons | GET | `/lessons/course/:courseId` | ❌ | Get course lessons |
| 40 | Lessons | PATCH | `/lessons/:id` | ✅ | Update lesson |
| 41 | Lessons | DELETE | `/lessons/:id` | ✅ | Delete lesson |
| **MATERIALS** |
| 42 | Materials | POST | `/materials` | ✅ | Create material |
| 43 | Materials | GET | `/materials` | ❌ | List materials |
| 44 | Materials | GET | `/materials/:id` | ❌ | Get material |
| 45 | Materials | GET | `/materials/course/:courseId` | ❌ | Get course materials |
| 46 | Materials | PATCH | `/materials/:id` | ✅ | Update material |
| 47 | Materials | DELETE | `/materials/:id` | ✅ | Delete material |
| **ASSIGNMENTS** |
| 48 | Assignments | POST | `/assignments` | ✅ | Create assignment |
| 49 | Assignments | GET | `/assignments` | ❌ | List assignments |
| 50 | Assignments | GET | `/assignments/:id` | ❌ | Get assignment |
| 51 | Assignments | GET | `/assignments/student/:studentId` | ✅ | Get student assignments |
| 52 | Assignments | GET | `/assignments/course/:courseId` | ❌ | Get course assignments |
| 53 | Assignments | PATCH | `/assignments/:id` | ✅ | Update assignment |
| 54 | Assignments | POST | `/assignments/:id/submit` | ✅ | Submit assignment |
| 55 | Assignments | POST | `/assignments/:id/grade` | ✅ | Grade assignment |
| 56 | Assignments | DELETE | `/assignments/:id` | ✅ | Delete assignment |
| **QUIZZES** |
| 57 | Quizzes | POST | `/quizzes` | ✅ | Create quiz |
| 58 | Quizzes | GET | `/quizzes` | ❌ | List quizzes |
| 59 | Quizzes | GET | `/quizzes/:id` | ❌ | Get quiz |
| 60 | Quizzes | GET | `/quizzes/course/:courseId` | ❌ | Get course quizzes |
| 61 | Quizzes | PATCH | `/quizzes/:id` | ✅ | Update quiz |
| 62 | Quizzes | DELETE | `/quizzes/:id` | ✅ | Delete quiz |
| 63 | Quizzes | POST | `/quizzes/:id/start` | ✅ | Start quiz attempt |
| 64 | Quizzes | POST | `/quizzes/attempts/:attemptId/submit` | ✅ | Submit quiz |
| 65 | Quizzes | GET | `/quizzes/attempts/:attemptId` | ✅ | Get quiz attempt |
| 66 | Quizzes | GET | `/quizzes/:id/attempts` | ✅ | Get my quiz attempts |
| 67 | Quizzes | GET | `/quizzes/:id/best-score` | ✅ | Get best score |
| **REVIEWS** |
| 68 | Reviews | POST | `/reviews` | ✅ | Create review |
| 69 | Reviews | GET | `/reviews` | ✅ | List reviews |
| 70 | Reviews | GET | `/reviews/:id` | ✅ | Get review |
| 71 | Reviews | GET | `/reviews/course/:courseId` | ✅ | Get course reviews |
| 72 | Reviews | GET | `/reviews/course/:courseId/stats` | ✅ | Get review stats |
| 73 | Reviews | PATCH | `/reviews/:id` | ✅ | Update review |
| 74 | Reviews | DELETE | `/reviews/:id` | ✅ | Delete review |
| 75 | Reviews | PATCH | `/reviews/:id/toggle-visibility` | ✅ | Toggle visibility |
| **SCHEDULES** |
| 76 | Schedules | GET | `/schedules` | ❌ | List schedules |
| 77 | Schedules | GET | `/schedules/my` | ✅ | My timetable |
| 78 | Schedules | GET | `/schedules/weekly` | ❌ | Weekly view |
| 79 | Schedules | GET | `/schedules/upcoming` | ❌ | Upcoming sessions |
| 80 | Schedules | GET | `/schedules/date-range` | ❌ | Sessions by date range |
| 81 | Schedules | GET | `/schedules/course/:courseId` | ❌ | Course schedules |
| 82 | Schedules | GET | `/schedules/teacher/:teacherId` | ❌ | Teacher schedules |
| 83 | Schedules | GET | `/schedules/:id` | ❌ | Get schedule |
| 84 | Schedules | POST | `/schedules` | ✅ (TEACHER/ADMIN) | Create schedule |
| 85 | Schedules | POST | `/schedules/recurring` | ✅ (TEACHER/ADMIN) | Create recurring |
| 86 | Schedules | PATCH | `/schedules/:id/cancel` | ✅ (TEACHER/ADMIN) | Cancel schedule |
| 87 | Schedules | PATCH | `/schedules/:id/postpone` | ✅ (TEACHER/ADMIN) | Postpone schedule |
| 88 | Schedules | PATCH | `/schedules/:id` | ✅ (TEACHER/ADMIN) | Update schedule |
| 89 | Schedules | DELETE | `/schedules/:id` | ✅ (ADMIN) | Delete schedule |
| **TEACHERS** |
| 90 | Teachers | POST | `/teachers` | ✅ (ADMIN) | Create teacher |
| 91 | Teachers | GET | `/teachers` | ✅ (ADMIN) | List teachers |
| 92 | Teachers | GET | `/teachers/:id` | ✅ | Get teacher |
| 93 | Teachers | PATCH | `/teachers/:id/approve` | ✅ (ADMIN) | Approve teacher |
| 94 | Teachers | PATCH | `/teachers/:id/reject` | ✅ (ADMIN) | Reject teacher |
| 95 | Teachers | PATCH | `/teachers/:id` | ✅ | Update teacher |
| 96 | Teachers | DELETE | `/teachers/:id` | ✅ (ADMIN) | Delete teacher |
| **STUDENTS** |
| 97 | Students | POST | `/students` | ✅ | Create student |
| 98 | Students | GET | `/students` | ✅ | List students |
| 99 | Students | GET | `/students/:id` | ✅ | Get student |
| 100 | Students | PATCH | `/students/:id` | ✅ | Update student |
| 101 | Students | DELETE | `/students/:id` | ✅ | Delete student |
| **SUPPORT TICKETS** |
| 102 | Tickets | POST | `/support-tickets` | ✅ | Create ticket |
| 103 | Tickets | GET | `/support-tickets` | ✅ | List tickets |
| 104 | Tickets | GET | `/support-tickets/stats` | ✅ | Get stats |
| 105 | Tickets | GET | `/support-tickets/my-tickets` | ✅ | My tickets |
| 106 | Tickets | GET | `/support-tickets/status/:status` | ✅ | Tickets by status |
| 107 | Tickets | GET | `/support-tickets/:id` | ✅ | Get ticket |
| 108 | Tickets | PATCH | `/support-tickets/:id` | ✅ | Update ticket |
| 109 | Tickets | POST | `/support-tickets/:id/respond` | ✅ | Add response |
| 110 | Tickets | POST | `/support-tickets/:id/resolve` | ✅ | Resolve ticket |
| 111 | Tickets | POST | `/support-tickets/:id/close` | ✅ | Close ticket |
| 112 | Tickets | DELETE | `/support-tickets/:id` | ✅ | Delete ticket |
| **CATEGORIES** |
| 113 | Categories | POST | `/categories` | ✅ | Create category |
| 114 | Categories | GET | `/categories` | ❌ | List categories |
| 115 | Categories | GET | `/categories/:id` | ❌ | Get category |
| 116 | Categories | PATCH | `/categories/:id` | ✅ | Update category |
| 117 | Categories | DELETE | `/categories/:id` | ✅ | Delete category |

---

## Summary Statistics

- **Total Endpoints:** 117
- **Require Authentication:** 87 (74%)
- **Public Endpoints:** 30 (26%)
- **Modules:** 15
- **Most Endpoints:** Schedules (14), Courses (8), Enrollments (13)

## Authentication Legend

- ✅ **Required** - Must include `Authorization: Bearer {token}` header
- ❌ **Not Required** - Public endpoint
- ⚠️ **Role-Based** - Check role constraints in detailed docs

---

## Common Query Patterns

### List/Paginate
```
GET /api/{resource}?page=1&size=10&sort=createdAt:desc&filter=status:eq:ACTIVE&include=relation1|relation2
```

### Get Single
```
GET /api/{resource}/:id
```

### Create
```
POST /api/{resource}
Content-Type: application/json
Authorization: Bearer {token}
Body: { ... dto fields ... }
```

### Update
```
PATCH /api/{resource}/:id
Authorization: Bearer {token}
Body: { ... partial dto fields ... }
```

### Delete
```
DELETE /api/{resource}/:id
Authorization: Bearer {token}
```

---

## Enum Values

### User Roles
- `ADMIN`
- `TEACHER`
- `STUDENT`

### Course Status
- `DRAFT`
- `PENDING` (awaiting admin review)
- `APPROVED`
- `REJECTED`
- `PUBLISHED`

### Course Levels
- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`

### Enrollment Status
- `PENDING`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

### Lesson Types
- `VIDEO`
- `TEXT`
- `INTERACTIVE`

### Material Types
- `PDF`
- `DOCUMENT`
- `SPREADSHEET`
- `PRESENTATION`
- `VIDEO`
- `CODE`
- `OTHER`

### Assignment Status
- `PENDING`
- `SUBMITTED`
- `GRADED`

### Schedule Type
- `CLASS`
- `EXAM`
- `TUTORIAL`
- `MEETING`

### Ticket Status
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

### Ticket Priority
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### Ticket Category
- `TECHNICAL`
- `BILLING`
- `COURSE_CONTENT`
- `ACCOUNT`
- `OTHER`

### Gender
- `MALE`
- `FEMALE`
- `OTHER`

---

## Popular Workflows

### 1. Register & Login
1. `POST /auth/register` - Create account
2. `POST /auth/login` - Get tokens
3. Use `accessToken` for subsequent requests

### 2. Teacher Registration
1. `POST /auth/register/teacher` - Submit with CV
2. Admin runs `PATCH /teachers/:id/approve`
3. Teacher can then create courses

### 3. Create & Publish Course
1. `POST /courses` (TEACHER) - Create in DRAFT
2. `PATCH /courses/:id/submit` - Move to PENDING
3. Admin runs `PATCH /courses/:id/review` (approve)
4. Admin runs `PATCH /courses/:id/publish` (publish)
5. Students can now enroll

### 4. Student Learning Journey
1. `GET /courses` - Browse published courses
2. `POST /enrollments/enroll` - Enroll in course
3. `GET /lessons?filter=courseId:eq:...` - View lessons
4. `GET /materials?filter=courseId:eq:...` - Download materials
5. `GET /assignments?filter=courseId:eq:...` - View assignments
6. `POST /assignments/:id/submit` - Submit work
7. `POST /quizzes/:id/start` - Start quiz

### 5. View Timetable
1. `GET /schedules/my` - Personal timetable
2. `GET /schedules/weekly?weekStart=2026-04-07` - Week view
3. `GET /schedules/upcoming?days=7` - Next 7 days

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    // Resource data
  },
  "message": "Success"
}
```

**Error Format:**
```json
{
  "success": false,
  "statusCode": 400,
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  },
  "message": "Validation failed"
}
```

---

**For detailed information about each endpoint, request/response formats, and DTOs, refer to `API_ENDPOINTS_COMPLETE.md`**

