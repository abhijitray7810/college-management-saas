# Attendance System API Documentation

Production-grade attendance tracking integrated with the routine system.

## Overview

The Attendance System tracks student attendance through:
- **Sessions** - Class occurrences tied to routines
- **Records** - Individual student attendance entries

**Flow:**
```
Routine → Session (date-based) → Attendance Records (students)
```

## Business Rules

1. Only assigned teachers can create sessions and mark attendance
2. Sessions are unique per routine + date
3. Students must be enrolled in the semester to be marked
4. Attendance percentage calculated: `(present + late) / total * 100`

## API Endpoints

### Base URL
```
/api/attendance
```

---

## Session Management

### Create Session
```http
POST /api/attendance/session
Authorization: Bearer <token>
Content-Type: application/json

{
  "routineId": "uuid",
  "sessionDate": "2024-01-15T09:00:00Z",
  "topicCovered": "Introduction to Database Design",
  "notes": "Covered ER diagrams and normalization"
}
```

**Rules:**
- Only assigned teacher can create
- One session per routine per day
- Teacher ID auto-extracted from token

**Response (201):**
```json
{
  "success": true,
  "message": "Attendance session created successfully",
  "data": {
    "id": "uuid",
    "routineId": "uuid",
    "teacherId": "uuid",
    "sessionDate": "2024-01-15T09:00:00Z",
    "topicCovered": "Introduction to Database Design",
    "routine": {
      "subject": { "name": "Database Systems", "code": "CS301" },
      "semester": { "name": "Semester 3", "course": { "name": "B.Tech CSE" } },
      "timeSlot": { "day": "MONDAY", "startTime": "09:00:00" }
    }
  }
}
```

---

### Get Session Details
```http
GET /api/attendance/session/:sessionId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sessionDate": "2024-01-15T09:00:00Z",
    "topicCovered": "Introduction to Database Design",
    "teacher": { "user": { "name": "Dr. John Doe" } },
    "routine": {
      "subject": { "name": "Database Systems" },
      "semester": { "name": "Semester 3" }
    },
    "records": [
      {
        "studentId": "uuid",
        "student": { "user": { "name": "Alice Smith" } },
        "status": "PRESENT",
        "remarks": ""
      }
    ],
    "stats": {
      "totalStudents": 30,
      "presentCount": 25,
      "absentCount": 3,
      "lateCount": 2,
      "excusedCount": 0,
      "attendancePercentage": 83
    }
  }
}
```

---

### Get Routine Sessions
```http
GET /api/attendance/routine/:routineId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "routine": { ... },
    "sessions": [
      {
        "id": "uuid",
        "sessionDate": "2024-01-15T09:00:00Z",
        "topicCovered": "...",
        "records": [ { "status": "PRESENT" }, { "status": "ABSENT" } ]
      }
    ],
    "totalSessions": 15
  }
}
```

---

### Delete Session
```http
DELETE /api/attendance/session/:sessionId
Authorization: Bearer <token>
```

**Notes:**
- Deletes session and all attendance records
- Only admin or assigned teacher can delete

---

## Attendance Marking

### Mark Attendance (Bulk)
```http
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "uuid",
  "records": [
    { "studentId": "uuid-1", "status": "PRESENT" },
    { "studentId": "uuid-2", "status": "ABSENT", "remarks": "Sick leave" },
    { "studentId": "uuid-3", "status": "LATE", "remarks": "Arrived 10 min late" },
    { "studentId": "uuid-4", "status": "EXCUSED", "remarks": "College event" }
  ]
}
```

**Status Enum:** `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`

**Response (201):**
```json
{
  "success": true,
  "message": "Attendance marked for 30 students",
  "data": {
    "sessionId": "uuid",
    "markedCount": 30,
    "stats": {
      "totalStudents": 30,
      "presentCount": 25,
      "absentCount": 3,
      "lateCount": 2,
      "excusedCount": 0
    }
  }
}
```

---

### Mark All Present (Quick)
```http
POST /api/attendance/mark-all-present/:sessionId
Authorization: Bearer <token>
```

**Response (201):**
```json
{
  "success": true,
  "message": "All 30 students marked present",
  "data": {
    "sessionId": "uuid",
    "markedCount": 30,
    "stats": { ... }
  }
}
```

---

### Update Attendance Record
```http
PATCH /api/attendance/update/:sessionId/:studentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PRESENT",
  "remarks": "Correction: was marked absent by mistake"
}
```

---

## Attendance Reports

### Get Student Attendance
```http
GET /api/attendance/student/:studentId?semesterId=uuid&startDate=2024-01-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "overall": {
      "totalSessions": 120,
      "totalPresent": 108,
      "percentage": 90
    },
    "subjectWise": [
      {
        "subjectId": "uuid",
        "subjectName": "Database Systems",
        "subjectCode": "CS301",
        "totalSessions": 15,
        "presentCount": 14,
        "absentCount": 0,
        "lateCount": 1,
        "excusedCount": 0,
        "percentage": 93
      },
      {
        "subjectId": "uuid",
        "subjectName": "Algorithms",
        "subjectCode": "CS302",
        "totalSessions": 15,
        "presentCount": 12,
        "absentCount": 2,
        "lateCount": 1,
        "excusedCount": 0,
        "percentage": 80
      }
    ]
  }
}
```

**Note:** Students can only view their own attendance.

---

### Get My Attendance (Student Only)
```http
GET /api/attendance/my-attendance?semesterId=uuid
Authorization: Bearer <student_token>
```

Convenience endpoint for students to view their own attendance.

---

### Get Subject Attendance (Class Report)
```http
GET /api/attendance/subject/:subjectId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "subjectId": "uuid",
    "classAverage": 85,
    "totalStudents": 30,
    "studentWise": [
      {
        "studentId": "uuid",
        "enrollmentNumber": "ENR001",
        "studentName": "Alice Smith",
        "totalSessions": 15,
        "presentCount": 15,
        "absentCount": 0,
        "lateCount": 0,
        "excusedCount": 0,
        "percentage": 100,
        "status": "GOOD"
      },
      {
        "studentId": "uuid",
        "enrollmentNumber": "ENR002",
        "studentName": "Bob Johnson",
        "totalSessions": 15,
        "presentCount": 10,
        "absentCount": 3,
        "lateCount": 2,
        "excusedCount": 0,
        "percentage": 67,
        "status": "AVERAGE"
      }
    ]
  }
}
```

**Status Classification:**
- `GOOD` - ≥ 75%
- `AVERAGE` - 60-74%
- `POOR` - < 60%

---

## RBAC Summary

| Endpoint | ADMIN | TEACHER | STUDENT |
|----------|-------|---------|---------|
| `POST /session` | ✓ | ✓ | ✗ |
| `GET /session/:id` | ✓ | ✓ | ✓ |
| `GET /routine/:id` | ✓ | ✓ | ✗ |
| `DELETE /session/:id` | ✓ | ✓ | ✗ |
| `POST /mark` | ✓ | ✓ | ✗ |
| `POST /mark-all-present/:id` | ✓ | ✓ | ✗ |
| `PATCH /update/:session/:student` | ✓ | ✓ | ✗ |
| `GET /subject/:id` | ✓ | ✓ | ✗ |
| `GET /student/:id` | ✓ | ✓ | Own only |
| `GET /my-attendance` | ✗ | ✗ | ✓ |

---

## Complete Workflow

### Daily Attendance Process

```bash
# 1. Teacher creates session for their class
POST /api/attendance/session
{
  "routineId": "routine-uuid",
  "sessionDate": "2024-01-15T09:00:00Z",
  "topicCovered": "SQL Joins"
}

# 2. Mark attendance for all students
POST /api/attendance/mark
{
  "sessionId": "session-uuid",
  "records": [
    { "studentId": "student-1", "status": "PRESENT" },
    { "studentId": "student-2", "status": "ABSENT" }
  ]
}

# 3. View session summary
GET /api/attendance/session/session-uuid
```

### End of Semester Report

```bash
# Get class attendance report
GET /api/attendance/subject/subject-uuid

# Get individual student report
GET /api/attendance/student/student-uuid?semesterId=semester-uuid
```

---

## Files Structure

```
src/features/attendance/
├── attendance.controller.js    # HTTP handlers
├── attendance.service.js       # Business logic
├── attendance.repository.js    # Database queries
├── attendance.routes.js      # Route definitions
└── attendance.validation.js  # Zod schemas
```

---

## Performance Features

1. **Bulk insert** for marking attendance (single query)
2. **Aggregation queries** for percentage calculation (DB-level)
3. **Indexing** on `student_id`, `session_id`, `routine_id`
4. **Duplicate prevention** via unique constraints

---

## Error Handling

| Code | Scenario |
|------|----------|
| 400 | Invalid UUID, missing required fields |
| 403 | Teacher not assigned to routine |
| 404 | Session/routine/student not found |
| 409 | Duplicate session for same routine + date |
| 500 | Database error |
