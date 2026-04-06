# EduNet Backend API - Module Structure Guide

## API Organization by Domain

This document provides a domain-focused view of all API endpoints, organized by module/feature.

---

## 1. Authentication & Access Control (`/auth`)

Handles user registration, login, token management, and password recovery.

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | ❌ | User login with email/password |
| `/auth/register` | POST | ❌ | Register as student (default) |
| `/auth/register/teacher` | POST | ❌ | Register as teacher (CV upload) |
| `/auth/profile` | GET | ✅ | Get logged-in user's profile |
| `/auth/refresh` | POST | ❌ | Get new access token using refresh token |
| `/auth/logout` | POST | ✅ | Logout and revoke refresh token |
| `/auth/forgot-password` | POST | ❌ | Request password reset email |
| `/auth/reset-password` | POST | ❌ | Reset password with token |

**Key DTOs:**
- `LoginDto`: email, password
- `RegisterDto`: firstName, lastName, email, password, phone, role
- `RegisterTeacherDto`: + qualification, specialization, experience, bio, cv (file)

---

## 2. User Management (`/users`)

User profile management and directory access.

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/users` | GET | ✅ | List all users (paginated) |
| `/users/:id` | GET | ✅ | Get user by ID |
| `/users/:id` | PATCH | ✅ | Update user profile |
| `/users/:id` | DELETE | ✅ | Delete user (soft delete) |

**Updateable Fields:**
- firstName, lastName, phone, avatar, bio
- dateOfBirth, gender, address, city, country
- isActive

---

## 3. Course Management (`/courses`)

Complete course lifecycle from creation to publishing.

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/courses` | POST | ✅ (T/A) | Create course |
| `/courses` | GET | ❌ | List courses (role-filtered) |
| `/courses/:id` | GET | ❌ | Get course details |
| `/courses/:id` | PATCH | ✅ | Edit course (owner/admin) |
| `/courses/:id/submit` | PATCH | ✅ (T) | Submit for admin review |
| `/courses/:id/review` | PATCH | ✅ (A) | Approve/reject course |
| `/courses/:id/publish` | PATCH | ✅ (A) | Publish course |
| `/courses/:id` | DELETE | ✅ | Delete course |

**Status Flow:**
```
DRAFT → PENDING → APPROVED → PUBLISHED
                ↓
             REJECTED (can resubmit)
```

**Key DTOs:**
- `CreateCourseDto`: title (req), description, thumbnail, price, level, language, tags, goal, startDate, teacherId, categoryId
- `UpdateCourseStatusDto`: status (APPROVED/REJECTED), rejectionReason

---

## 4. Course Content

### Lessons (`/lessons`)
Course lecture/lesson units

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/lessons` | POST | ✅ | Create lesson |
| `/lessons` | GET | ❌ | List lessons |
| `/lessons/:id` | GET | ❌ | Get lesson |
| `/lessons/course/:courseId` | GET | ❌ | Get course's lessons |
| `/lessons/:id` | PATCH | ✅ | Update lesson |
| `/lessons/:id` | DELETE | ✅ | Delete lesson |

**Key Fields:** title, description, type (VIDEO/TEXT/INTERACTIVE), content, videoUrl, duration, order, isFree, courseId

### Materials (`/materials`)
Course resources (PDFs, documents, downloads)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/materials` | POST | ✅ | Create material |
| `/materials` | GET | ❌ | List materials |
| `/materials/:id` | GET | ❌ | Get material |
| `/materials/course/:courseId` | GET | ❌ | Get course materials |
| `/materials/:id` | PATCH | ✅ | Update material |
| `/materials/:id` | DELETE | ✅ | Delete material |

**Key Fields:** title, description, type (PDF/DOCUMENT/VIDEO/CODE/etc), downloadUrl, size, courseId

---

## 5. Learning & Assessment

### Assignments (`/assignments`)
Student homework/projects

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/assignments` | POST | ✅ | Create assignment |
| `/assignments` | GET | ❌ | List assignments |
| `/assignments/:id` | GET | ❌ | Get assignment |
| `/assignments/student/:studentId` | GET | ✅ | Get student's assignments |
| `/assignments/course/:courseId` | GET | ❌ | Get course assignments |
| `/assignments/:id` | PATCH | ✅ | Update assignment |
| `/assignments/:id/submit` | POST | ✅ | Student submits work |
| `/assignments/:id/grade` | POST | ✅ | Teacher grades work |
| `/assignments/:id` | DELETE | ✅ | Delete assignment |

**Status Flow:** PENDING → SUBMITTED → GRADED

### Quizzes (`/quizzes`)
Course assessments/tests

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/quizzes` | POST | ✅ | Create quiz |
| `/quizzes` | GET | ❌ | List quizzes |
| `/quizzes/:id` | GET | ❌ | Get quiz |
| `/quizzes/course/:courseId` | GET | ❌ | Get course quizzes |
| `/quizzes/:id` | PATCH | ✅ | Update quiz |
| `/quizzes/:id` | DELETE | ✅ | Delete quiz |
| `/quizzes/:id/start` | POST | ✅ | Start quiz attempt |
| `/quizzes/attempts/:attemptId/submit` | POST | ✅ | Submit quiz answers |
| `/quizzes/attempts/:attemptId` | GET | ✅ | Get attempt result |
| `/quizzes/:id/attempts` | GET | ✅ | Get my attempts |
| `/quizzes/:id/best-score` | GET | ✅ | Get best score |

**Key Fields:** title, description, duration, questions[], maxAttempts, passingScore, shuffleQuestions, showCorrectAnswers

---

## 6. Enrollment & Progress (`/enrollments`)

Student course registration and progress tracking

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/enrollments` | POST | ✅ | Create enrollment |
| `/enrollments/enroll` | POST | ✅ | Enroll current user |
| `/enrollments` | GET | ✅ | List all enrollments |
| `/enrollments/my-enrollments` | GET | ✅ | Get my enrollments |
| `/enrollments/check/:courseId` | GET | ✅ | Check if enrolled |
| `/enrollments/course/:courseId` | GET | ✅ | Get course enrollments |
| `/enrollments/:id` | GET | ✅ | Get enrollment |
| `/enrollments/user/:userId` | GET | ✅ | Get user enrollments |
| `/enrollments/:id` | PATCH | ✅ | Update enrollment |
| `/enrollments/:id/approve` | PATCH | ✅ | Approve enrollment |
| `/enrollments/:id/reject` | PATCH | ✅ | Reject enrollment |
| `/enrollments/:id/progress` | PATCH | ✅ | Update progress (0-100) |
| `/enrollments/:id` | DELETE | ✅ | Delete enrollment |

**Status Flow:** PENDING → ACTIVE → COMPLETED

---

## 7. Reviews & Ratings (`/reviews`)

Course reviews and ratings

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/reviews` | POST | ✅ | Create review |
| `/reviews` | GET | ✅ | List reviews |
| `/reviews/:id` | GET | ✅ | Get review |
| `/reviews/course/:courseId` | GET | ✅ | Get course reviews |
| `/reviews/course/:courseId/stats` | GET | ✅ | Get review statistics |
| `/reviews/:id` | PATCH | ✅ | Update review |
| `/reviews/:id` | DELETE | ✅ | Delete review |
| `/reviews/:id/toggle-visibility` | PATCH | ✅ | Toggle public/private |

**Key Fields:** rating (1-5), comment, courseId

---

## 8. Scheduling & Timetable (`/schedules`)

Class schedules, sessions, and timetable management

### Single Session
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/schedules` | POST | ✅ (T/A) | Create single schedule |
| `/schedules/:id` | PATCH | ✅ (T/A) | Update schedule |
| `/schedules/:id/cancel` | PATCH | ✅ (T/A) | Cancel session |
| `/schedules/:id/postpone` | PATCH | ✅ (T/A) | Reschedule session |
| `/schedules/:id` | DELETE | ✅ (A) | Hard-delete |

### Recurring Sessions
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/schedules/recurring` | POST | ✅ (T/A) | Create repeating sessions |

**Fields:** weekDays (0-6), startDate, recurrenceEndDate, startTime, endTime, e.g., "Every Mon/Wed for 12 weeks"

### Query by Time/Context
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/schedules` | GET | ❌ | List all schedules |
| `/schedules/my` | GET | ✅ | Personal timetable |
| `/schedules/weekly` | GET | ❌ | Week view (calendar) |
| `/schedules/upcoming` | GET | ❌ | Next N days |
| `/schedules/date-range` | GET | ❌ | Between two dates |
| `/schedules/course/:courseId` | GET | ❌ | Course sessions |
| `/schedules/teacher/:teacherId` | GET | ❌ | Teacher's sessions |
| `/schedules/:id` | GET | ❌ | Get single schedule |

---

## 9. Educator Profiles

### Teachers (`/teachers`)
Teacher onboarding, approval, and profiles

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/teachers` | POST | ✅ (A) | Create teacher |
| `/teachers` | GET | ✅ (A) | List teachers (admin only) |
| `/teachers/:id` | GET | ✅ | Get teacher profile |
| `/teachers/:id/approve` | PATCH | ✅ (A) | Approve registration |
| `/teachers/:id/reject` | PATCH | ✅ (A) | Reject registration |
| `/teachers/:id` | PATCH | ✅ | Update profile |
| `/teachers/:id` | DELETE | ✅ (A) | Delete teacher |

**Status Flow:**
- From registration: PENDING → APPROVED
- Alternative: PENDING → REJECTED

### Students (`/students`)
Student profiles and records

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/students` | POST | ✅ | Create student |
| `/students` | GET | ✅ | List students |
| `/students/:id` | GET | ✅ | Get student |
| `/students/:id` | PATCH | ✅ | Update profile |
| `/students/:id` | DELETE | ✅ | Delete student |

---

## 10. Support & Help (`/support-tickets`)

Student/user support ticket system

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/support-tickets` | POST | ✅ | Create support ticket |
| `/support-tickets` | GET | ✅ | List tickets |
| `/support-tickets/stats` | GET | ✅ | Ticket statistics |
| `/support-tickets/my-tickets` | GET | ✅ | My tickets |
| `/support-tickets/status/:status` | GET | ✅ | Filter by status |
| `/support-tickets/:id` | GET | ✅ | Get ticket |
| `/support-tickets/:id` | PATCH | ✅ | Update ticket |
| `/support-tickets/:id/respond` | POST | ✅ | Add response |
| `/support-tickets/:id/resolve` | POST | ✅ | Mark resolved |
| `/support-tickets/:id/close` | POST | ✅ | Close ticket |
| `/support-tickets/:id` | DELETE | ✅ | Delete ticket |

**Status Flow:** OPEN → IN_PROGRESS → RESOLVED → CLOSED

**Priority:** LOW, MEDIUM, HIGH, URGENT
**Category:** TECHNICAL, BILLING, COURSE_CONTENT, ACCOUNT, OTHER

---

## 11. Content Organization (`/categories`)

Course categorization and taxonomy

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/categories` | POST | ✅ | Create category |
| `/categories` | GET | ❌ | List categories |
| `/categories/:id` | GET | ❌ | Get category |
| `/categories/:id` | PATCH | ✅ | Update category |
| `/categories/:id` | DELETE | ✅ | Delete category |

**Key Fields:** name, description, icon, color

---

## 12. System Health (`/`)

Basic system endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/` | GET | ❌ | Root message |
| `/health` | GET | ❌ | Health check |

---

## Access Control Matrix

| Feature | Admin | Teacher | Student | Public |
|---------|:-----:|:-------:|:-------:|:------:|
| **Auth** |
| Login/Register | ✅ | ✅ | ✅ | ✅ |
| Get Profile | ✅ | ✅ | ✅ | - |
| **Users** |
| List/View | ✅ | ✅ | ✅ | - |
| Update Own | ✅ | ✅ | ✅ | - |
| Delete User | ✅ | - | - | - |
| **Courses** |
| View Published | ✅ | ✅ | ✅ | ✅ |
| Create Course | ✅ | ✅ | - | - |
| Review Course | ✅ | ✅ | - | - |
| Publish Course | ✅ | - | - | - |
| **Enrollment** |
| Enroll | ✅ | ✅ | ✅ | - |
| Manage | ✅ | ⚠️ | ⚠️ | - |
| **Learning Content** |
| Create/Edit | ✅ | ✅ | - | - |
| View | ✅ | ✅ | ✅ | ⚠️ |
| **Schedules** |
| Create | ✅ | ✅ | - | - |
| View | ✅ | ✅ | ✅ | ✅ |
| My Timetable | ✅ | ✅ | ✅ | - |
| **Teachers** |
| List | ✅ | - | - | - |
| Approve/Reject | ✅ | - | - | - |
| **Support** |
| Create Ticket | ✅ | ✅ | ✅ | - |
| Manage All | ✅ | - | - | - |

**Legend:**
- ✅ = Full access
- ⚠️ = Conditional/partial access
- `-` = No access
- ❌ = Blocked

---

## Common Response Patterns

### Successful Response (200)
```json
{
  "success": true,
  "statusCode": 200,
  "data": { /* resource */ },
  "message": "Operation successful"
}
```

### Paginated List (200)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "rows": [ /* items */ ],
    "count": 50
  },
  "message": "Success"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "statusCode": 400,
  "errors": {
    "email": ["Email is required", "Invalid email format"],
    "password": ["Minimum 6 characters"]
  },
  "message": "Validation failed"
}
```

### Authorization Error (401)
```json
{
  "success": false,
  "statusCode": 401,
  "errors": {},
  "message": "Unauthorized - Missing or invalid token"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "statusCode": 403,
  "errors": {},
  "message": "Forbidden - Insufficient permissions"
}
```

### Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "errors": {},
  "message": "Resource not found"
}
```

---

## Query String Reference for All List Endpoints

### Basic Pagination
```
?page=2&size=20
```

### Sorting (Multiple)
```
?sort=createdAt:desc&sort=title:asc
```

### Filtering (Multiple)
```
?filter=status:eq:ACTIVE&filter=price:gte:50&filter=title:like:web
```

### Including Relations
```
?include=teacher|category|enrollments
```

### Combined Example
```
GET /api/courses?page=1&size=10
  &sort=createdAt:desc
  &filter=status:eq:PUBLISHED&filter=level:eq:BEGINNER
  &include=teacher|category|reviews
```

**Common Filter Rules:**
- `eq`, `neq` - Equals / Not equals
- `gt`, `gte`, `lt`, `lte` - Comparison
- `like`, `nlike` - Contains (case-insensitive)
- `in`, `nin` - In/not in array
- `isnull`, `isnotnull` - Null checks

---

**For detailed endpoint specifications, see: `API_ENDPOINTS_COMPLETE.md`**
**For quick reference table, see: `API_QUICK_REFERENCE.md`**

