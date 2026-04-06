# Schedule / Timetable System

All endpoints are prefixed with `/api`.

---

## Overview

The schedule system lets teachers and admins manage class sessions (timetable), while students can view their personalised schedule based on active enrollments. Key capabilities:

- Create single or bulk-recurring sessions
- Conflict detection (prevents double-booking same teacher or course at the same time)
- Cancel / postpone sessions with a reason
- Student timetable view (filtered by enrolled courses)
- Calendar week view (grouped by date)

---

## Entities

### `Schedule`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | varchar(500) | Required |
| `description` | text | Optional |
| `type` | enum | `class` \| `exam` \| `assignment` \| `event` |
| `status` | varchar(50) | `scheduled` \| `cancelled` \| `postponed` |
| `cancelReason` | text | Null unless cancelled/postponed |
| `date` | date | Session date (YYYY-MM-DD) |
| `startTime` | time | HH:mm format |
| `endTime` | time | HH:mm format |
| `location` | varchar(255) | Physical room / address |
| `meetingLink` | varchar(500) | Online meeting URL |
| `isOnline` | boolean | Default false |
| `courseId` | uuid FK | Links to `Courses` |
| `teacherId` | uuid FK | Links to `Users` |
| `createdAt` | timestamptz | Auto |
| `updatedAt` | timestamptz | Auto |
| `deletedAt` | timestamptz | Soft delete |

---

## Auth Roles

| Action | Required Role |
|---|---|
| View schedules (any read endpoint) | Public |
| View personal timetable (`GET /schedules/my`) | Authenticated |
| Create / update schedule | Teacher or Admin |
| Cancel / postpone | Teacher (own) or Admin |
| Delete | Admin only |

---

## Endpoints

### GET `/api/schedules`
Get paginated list with optional filtering, sorting, and relations.

**Query params:** `page`, `size`, `sort`, `filter`, `include`

---

### GET `/api/schedules/my`
**Auth required.** Returns upcoming schedules for all courses the authenticated user is actively enrolled in.

Response:
```json
[
  { "id": "...", "title": "React Basics", "date": "2026-05-05", "startTime": "08:00", ... }
]
```

---

### GET `/api/schedules/weekly?weekStart=2026-05-05`
Returns all schedules for the 7-day window starting at `weekStart`, grouped by date.

**Query params:**
- `weekStart` (required) — YYYY-MM-DD, any day of the week
- `courseId` (optional) — filter by course
- `teacherId` (optional) — filter by teacher

Response:
```json
{
  "weekStart": "2026-05-05",
  "weekEnd": "2026-05-11",
  "byDay": {
    "2026-05-05": [ { "id": "...", "title": "...", ... } ],
    "2026-05-06": [],
    "2026-05-07": [ { ... } ]
  }
}
```

---

### GET `/api/schedules/upcoming?days=14`
Returns non-cancelled schedules within the next N days (default 7).

---

### GET `/api/schedules/date-range?startDate=2026-05-01&endDate=2026-05-31`
Returns all schedules between two dates (inclusive).

---

### GET `/api/schedules/course/:courseId`
All schedules for a specific course, ordered by date/time ascending.

---

### GET `/api/schedules/teacher/:teacherId`
All schedules assigned to a specific teacher.

---

### GET `/api/schedules/:id`
Single schedule by ID with `course` and `teacher` relations.

---

### POST `/api/schedules`
**Roles: Teacher, Admin**

Create a single session. Conflict detection runs automatically.

Body:
```json
{
  "title": "React Hooks Deep Dive",
  "type": "class",
  "date": "2026-05-10",
  "startTime": "09:00",
  "endTime": "11:00",
  "isOnline": true,
  "meetingLink": "https://meet.example.com/abc",
  "courseId": "uuid",
  "teacherId": "uuid"  // admin only — teacher is set from token
}
```

Returns `201 Created` with saved schedule, or `409 Conflict` if the teacher or course is already booked.

---

### POST `/api/schedules/recurring`
**Roles: Teacher, Admin**

Bulk-create recurring sessions by specifying a date range and a set of weekdays.

Body:
```json
{
  "title": "Weekly React Class",
  "type": "class",
  "startDate": "2026-05-05",
  "recurrenceEndDate": "2026-07-25",
  "weekDays": [1, 3],
  "startTime": "09:00",
  "endTime": "11:00",
  "isOnline": false,
  "location": "Room 201",
  "courseId": "uuid"
}
```

`weekDays` values: `0` = Sunday, `1` = Monday, ..., `6` = Saturday.

Conflicting dates are **silently skipped** (not an error). Returns count of created sessions.

Response `201 Created`:
```json
{
  "count": 24,
  "sessions": [ ... ]
}
```

Returns `422 Unprocessable Entity` if zero sessions could be created (all slots conflicted or no weekdays match).

---

### PATCH `/api/schedules/:id/cancel`
**Roles: Teacher (own), Admin**

Cancel a session. Cannot cancel an already-cancelled schedule.

Body (optional):
```json
{ "cancelReason": "Teacher sick leave" }
```

---

### PATCH `/api/schedules/:id/postpone`
**Roles: Teacher (own), Admin**

Move a session to a new date/time. Conflict detection runs on the new slot. Status becomes `postponed`.

Body:
```json
{
  "newDate": "2026-05-12",
  "newStartTime": "10:00",
  "newEndTime": "12:00",
  "notes": "Moved due to public holiday"
}
```

---

### PATCH `/api/schedules/:id`
**Roles: Teacher (own), Admin**

General update of any schedule fields. Cannot update a cancelled session. Conflict detection runs.

---

### DELETE `/api/schedules/:id`
**Role: Admin only**

Soft-delete a schedule.

---

## Conflict Detection

A conflict exists when two sessions overlap in **time** on the **same date** for **the same teacher** or **the same course**, and neither is `cancelled`.

Overlap condition: `session1.startTime < session2.endTime AND session1.endTime > session2.startTime`

Endpoints that check for conflicts: `POST /`, `POST /recurring` (per session), `PATCH /:id`, `PATCH /:id/postpone`.

---

## Example Flows

### Teacher creates a weekly lecture series

```
POST /api/schedules/recurring
{
  "title": "Web Development — Spring 2026",
  "startDate": "2026-03-03",
  "recurrenceEndDate": "2026-06-23",
  "weekDays": [2, 4],   // Tuesday + Thursday
  "startTime": "14:00",
  "endTime": "16:00",
  "courseId": "uuid"
}
→ 201 { count: 32, sessions: [...] }
```

### Student views their timetable

```
GET /api/schedules/my
Authorization: Bearer <student-token>
→ 200 [ all upcoming sessions for enrolled courses ]
```

### Admin cancels a session

```
PATCH /api/schedules/:id/cancel
{ "cancelReason": "National holiday" }
→ 200 { ...schedule, status: "cancelled", cancelReason: "National holiday" }
```

### Frontend calendar renders a week

```
GET /api/schedules/weekly?weekStart=2026-05-04
→ 200 {
  weekStart: "2026-05-04",
  weekEnd: "2026-05-10",
  byDay: {
    "2026-05-04": [...],
    "2026-05-05": [],
    ...
    "2026-05-10": [...]
  }
}
```
