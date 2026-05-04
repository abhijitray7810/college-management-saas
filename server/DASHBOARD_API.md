# Dashboard & Analytics API Documentation

Production-grade analytics dashboard for College Management SaaS.

## Overview

The Dashboard System provides **aggregated insights** and **personalized views** for different user roles:

- **Student Dashboard** - Personal attendance, schedule, alerts
- **Teacher Dashboard** - Teaching load, schedule, pending tasks
- **Admin Dashboard** - System-wide analytics, counts, trends

## Core Principle

Dashboard APIs are **NOT CRUD** - they aggregate data from multiple sources and compute insights.

## API Endpoints

### Base URL
```
/api/dashboard
```

---

## Student Dashboard

### Get My Dashboard (Student)
```http
GET /api/dashboard/student
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "studentId": "uuid",
      "name": "Alice Smith",
      "email": "alice@college.edu",
      "enrollmentNumber": "ENR001",
      "course": "B.Tech Computer Science",
      "department": "CSE",
      "semester": "Semester 5",
      "academicYear": "2024-2025"
    },
    "attendance": {
      "overallPercentage": 87,
      "totalSessions": 120,
      "presentCount": 100,
      "absentCount": 12,
      "lateCount": 8,
      "excusedCount": 0
    },
    "subjects": [
      {
        "subjectId": "uuid",
        "subjectName": "Database Systems",
        "subjectCode": "CS301",
        "totalSessions": 15,
        "presentCount": 14,
        "absentCount": 1,
        "lateCount": 0,
        "percentage": 93,
        "isLowAttendance": false
      },
      {
        "subjectId": "uuid",
        "subjectName": "Algorithms",
        "subjectCode": "CS302",
        "totalSessions": 15,
        "presentCount": 10,
        "absentCount": 3,
        "lateCount": 2,
        "percentage": 67,
        "isLowAttendance": true
      }
    ],
    "alerts": {
      "lowAttendanceSubjects": 1,
      "lowAttendanceDetails": [
        {
          "subjectId": "uuid",
          "subjectName": "Algorithms",
          "percentage": 67,
          "required": 75
        }
      ]
    },
    "schedule": {
      "today": [
        {
          "routineId": "uuid",
          "subject": {
            "id": "uuid",
            "name": "Database Systems",
            "code": "CS301",
            "isLab": false
          },
          "teacher": {
            "id": "uuid",
            "name": "Dr. John Doe"
          },
          "room": {
            "id": "uuid",
            "code": "C-101",
            "name": "Classroom 101"
          },
          "timeSlot": {
            "day": "MONDAY",
            "startTime": "09:00:00",
            "endTime": "10:00:00",
            "slotNumber": 1
          }
        }
      ],
      "upcoming": [
        {
          "routineId": "uuid",
          "subject": { "name": "Algorithms", "code": "CS302" },
          "teacher": { "name": "Dr. Jane Smith" },
          "room": { "code": "C-102" },
          "timeSlot": { "day": "TUESDAY", "startTime": "10:00:00" }
        }
      ]
    }
  }
}
```

---

## Teacher Dashboard

### Get My Dashboard (Teacher)
```http
GET /api/dashboard/teacher
Authorization: Bearer <teacher_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "teacherId": "uuid",
      "name": "Dr. John Doe",
      "email": "john@college.edu",
      "employeeId": "T001",
      "designation": "Associate Professor"
    },
    "schedule": {
      "today": [
        {
          "routineId": "uuid",
          "subject": { "id": "uuid", "name": "Database Systems", "code": "CS301" },
          "semester": { "id": "uuid", "name": "Semester 5" },
          "room": { "id": "uuid", "code": "C-101", "name": "Classroom 101" },
          "timeSlot": { "day": "MONDAY", "startTime": "09:00:00", "endTime": "10:00:00" }
        }
      ],
      "todayCount": 3
    },
    "workload": {
      "weeklySessions": 18,
      "totalSubjects": 3,
      "averageSessionsPerSubject": 6,
      "maxSessionsPerSubject": 8,
      "minSessionsPerSubject": 4
    },
    "subjects": [
      { "subjectId": "uuid", "name": "Database Systems", "code": "CS301", "sessionCount": 6 },
      { "subjectId": "uuid", "name": "Data Structures", "code": "CS201", "sessionCount": 8 },
      { "subjectId": "uuid", "name": "DBMS Lab", "code": "CS302", "sessionCount": 4 }
    ],
    "alerts": {
      "pendingAttendanceCount": 2,
      "pendingSessions": [
        {
          "sessionId": "uuid",
          "subject": "Database Systems",
          "semester": "Semester 5",
          "date": "2024-01-15T09:00:00Z",
          "topic": "SQL Basics"
        }
      ]
    }
  }
}
```

---

## Admin Dashboard

### Get Admin Dashboard
```http
GET /api/dashboard/admin
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "counts": {
      "students": 500,
      "teachers": 35,
      "subjects": 45,
      "rooms": 25,
      "activeSemesters": 6
    },
    "attendance": {
      "overallPercentage": 82,
      "totalRecords": 15000,
      "presentCount": 12000,
      "absentCount": 2000,
      "lateCount": 800,
      "excusedCount": 200
    },
    "alerts": {
      "lowAttendanceStudents": 45,
      "overloadedTeachers": 3,
      "overloadedTeacherDetails": [
        {
          "teacherId": "uuid",
          "name": "Dr. Overworked",
          "sessionCount": 28
        }
      ]
    },
    "utilization": {
      "averageRoomUtilization": 75,
      "roomDetails": [
        {
          "roomId": "uuid",
          "bookedSlots": 35,
          "utilizationPercentage": 83
        }
      ],
      "averageTeacherLoad": 15,
      "maxTeacherLoad": 28,
      "teacherDistribution": [
        { "teacherId": "uuid", "teacherName": "Dr. John", "sessionCount": 18 }
      ]
    },
    "routineStats": {
      "totalSessions": 540,
      "labSessions": 180,
      "theorySessions": 360,
      "labPercentage": 33,
      "theoryPercentage": 67
    },
    "trends": {
      "weeklyAttendance": [
        { "date": "2024-01-08", "presentCount": 450, "totalCount": 500, "percentage": 90 },
        { "date": "2024-01-09", "presentCount": 440, "totalCount": 500, "percentage": 88 },
        { "date": "2024-01-10", "presentCount": 460, "totalCount": 500, "percentage": 92 }
      ]
    }
  }
}
```

---

### Get Quick Stats (For Header/Widget)
```http
GET /api/dashboard/stats
Authorization: Bearer <admin_or_teacher_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "counts": {
      "students": 500,
      "teachers": 35,
      "subjects": 45,
      "rooms": 25,
      "activeSemesters": 6
    },
    "attendance": {
      "overallPercentage": 82
    },
    "alerts": {
      "lowAttendanceStudents": 45,
      "overloadedTeachers": 3
    }
  }
}
```

---

## Key Aggregation Queries

### Overall Attendance Percentage
```sql
SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
  SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_count
FROM attendance_records
```

### Low Attendance Students (< 75%)
```sql
SELECT student_id, COUNT(*) as total,
  (SUM(CASE WHEN status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentage
FROM attendance_records
GROUP BY student_id
HAVING percentage < 75
```

### Room Utilization
```sql
SELECT room_id, COUNT(*) as booked_slots,
  (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM time_slots)) as utilization_pct
FROM routines WHERE is_active = true
GROUP BY room_id
```

### Teacher Load Distribution
```sql
SELECT teacher_id, COUNT(*) as session_count
FROM routines WHERE is_active = true
GROUP BY teacher_id
ORDER BY session_count DESC
```

### Weekly Attendance Trend
```sql
SELECT DATE(session_date) as date,
  SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
  COUNT(*) as total_count
FROM attendance_records ar
JOIN attendance_sessions asess ON ar.session_id = asess.id
WHERE session_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(session_date)
ORDER BY date ASC
```

---

## RBAC Summary

| Endpoint | ADMIN | TEACHER | STUDENT |
|----------|-------|---------|---------|
| `GET /student` | ✗ | ✗ | ✓ (own) |
| `GET /student/:id` | ✓ | ✓ | Own only |
| `GET /teacher` | ✗ | ✓ (own) | ✗ |
| `GET /teacher/:id` | ✓ | Own only | ✗ |
| `GET /admin` | ✓ | ✗ | ✗ |
| `GET /stats` | ✓ | ✓ | ✗ |

---

## Response Design Pattern

All dashboard responses follow this structure:

```json
{
  "success": true,
  "data": {
    "summary": {},      // User/entity info
    "stats": {},        // Key metrics
    "schedule": {},     // Time-based data
    "alerts": {},       // Warnings/notifications
    "trends": {}        // Historical data (optional)
  }
}
```

---

## Performance Features

1. **Parallel queries** - `Promise.all()` for independent data
2. **DB-level aggregation** - `COUNT`, `SUM`, `GROUP BY` in SQL
3. **Indexed fields** - `student_id`, `teacher_id`, `subject_id`
4. **Limited data** - Only essential fields selected
5. **Computed percentages** - Calculated at DB or service layer

---

## Files Structure

```
src/features/dashboard/
├── dashboard.repository.js    # Analytics queries
├── dashboard.service.js     # Aggregation logic
├── dashboard.controller.js  # HTTP handlers
├── dashboard.routes.js      # Route definitions
└── DASHBOARD_API.md         # Documentation
```

---

## Example: Frontend Integration

```javascript
// Student Dashboard
const response = await fetch('/api/dashboard/student', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

// Display
renderWelcome(data.data.summary.name);
renderAttendanceChart(data.data.attendance);
renderTodaySchedule(data.data.schedule.today);
showAlerts(data.data.alerts.lowAttendanceDetails);
```
