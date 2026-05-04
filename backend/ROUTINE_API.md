# Routine Generator API Documentation

Production-grade timetable generator using backtracking algorithm with constraint satisfaction.

## Overview

The Routine Generator creates valid timetables by solving a **Constraint Satisfaction Problem (CSP)** using backtracking. It ensures:

- ✓ No teacher is double-booked
- ✓ No room is double-booked
- ✓ Teacher availability is respected
- ✓ Room availability is respected
- ✓ Lab subjects use LAB rooms only
- ✓ All subject hours are scheduled

## Algorithm

```
1. Expand subjects → individual sessions (hours_per_week)
2. Sort: Lab subjects first, then by hours (descending)
3. Backtracking with constraint checking:
   - Try each time slot
   - Try each teacher for subject
   - Try each suitable room
   - If valid → recurse deeper
   - If dead end → backtrack
4. Save successful assignments to DB
```

## API Endpoints

### Base URL
```
/api/routine
```

---

## Generate Routine

### POST /api/routine/generate

Generate a new routine for a semester using the backtracking algorithm.

**Request:**
```http
POST /api/routine/generate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "semesterId": "uuid",
  "academicYear": "2024-2025",
  "preferSpreadAcrossDays": true,
  "prioritizeLabs": true,
  "maxIterations": 10000
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| semesterId | uuid | ✓ | Target semester |
| academicYear | string | ✗ | Academic year (auto-detected if not provided) |
| preferSpreadAcrossDays | boolean | ✗ | Spread subject sessions across days (default: true) |
| prioritizeLabs | boolean | ✗ | Schedule lab subjects first (default: true) |
| maxIterations | number | ✗ | Max backtracking attempts (default: 10000) |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Routine generated successfully",
  "data": {
    "semesterId": "uuid",
    "academicYear": "2024-2025",
    "routines": [
      {
        "id": "uuid",
        "semesterId": "uuid",
        "subjectId": "uuid",
        "teacherId": "uuid",
        "roomId": "uuid",
        "timeSlotId": "uuid",
        "isActive": true
      }
    ],
    "stats": {
      "totalSessions": 45,
      "assignedSessions": 45,
      "iterations": 1234,
      "subjectCount": 12
    }
  }
}
```

**Error Response (409):** Routine already exists
```json
{
  "success": false,
  "message": "Routine already exists for this semester. Delete existing routine first or use regenerate option."
}
```

**Error Response (422):** Cannot generate with current constraints
```json
{
  "success": false,
  "message": "Unable to generate valid routine with current constraints",
  "stats": {
    "totalSessions": 45,
    "assignedSessions": 38,
    "iterations": 10000
  }
}
```

**Notes:**
- Generation may take 10-60 seconds depending on complexity
- Request timeout extended to 5 minutes
- Uses database transaction - all or nothing save

---

## Preview Generation

### GET /api/routine/preview/:semesterId

Check if routine can be generated before attempting.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "semester": { ... },
    "preview": {
      "subjectCount": 12,
      "totalSessionsNeeded": 45,
      "availableRooms": 15,
      "availableTimeSlots": 42,
      "totalRoomSlots": 630,
      "subjectsWithoutTeachers": ["Advanced Physics"],
      "canGenerate": false,
      "warnings": ["1 subjects have no assigned teachers"]
    }
  }
}
```

---

## View Routine

### GET /api/routine/:semesterId

Get complete routine for a semester.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "semester": { ... },
    "totalSessions": 45,
    "uniqueSubjects": 12,
    "uniqueTeachers": 8,
    "uniqueRooms": 10,
    "routines": [
      {
        "id": "uuid",
        "subject": {
          "id": "uuid",
          "name": "Database Systems",
          "code": "CS301",
          "isLab": false
        },
        "teacher": {
          "id": "uuid",
          "employeeId": "T001",
          "user": { "name": "Dr. John Doe" }
        },
        "room": {
          "id": "uuid",
          "code": "C-101",
          "name": "Classroom 101",
          "type": "CLASSROOM"
        },
        "timeSlot": {
          "id": "uuid",
          "day": "MONDAY",
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "slotNumber": 1
        }
      }
    ],
    "groupedByDay": {
      "MONDAY": [...],
      "TUESDAY": [...],
      "WEDNESDAY": [...],
      "THURSDAY": [...],
      "FRIDAY": [...],
      "SATURDAY": [...]
    }
  }
}
```

---

## View by Day

### GET /api/routine/:semesterId/day/:day

Get routine for specific day.

**Example:** `/api/routine/:semesterId/day/monday`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "semester": { ... },
    "day": "MONDAY",
    "sessions": [...],
    "sessionCount": 8
  }
}
```

---

## View Teacher's Routine

### GET /api/routine/:semesterId/teacher/:teacherId

Get routine for specific teacher.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "semester": { ... },
    "teacherId": "uuid",
    "teacherName": "Dr. John Doe",
    "totalSessions": 15,
    "byDay": {
      "MONDAY": [...],
      "TUESDAY": [...],
      ...
    }
  }
}
```

---

## View Student's Routine

### GET /api/routine/:semesterId/student

Get full semester routine (students see all classes).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "semester": { ... },
    "totalSessions": 45,
    "uniqueSubjects": 12,
    "groupedByDay": { ... }
  }
}
```

---

## Validate Constraints

### GET /api/routine/:semesterId/validate

Check existing routine for constraint violations.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "totalRoutines": 45,
    "conflictCount": 2,
    "conflicts": [
      {
        "type": "TEACHER_DOUBLE_BOOKED",
        "teacherId": "uuid",
        "teacherName": "Dr. John Doe",
        "timeSlot": { "day": "MONDAY", "startTime": "09:00:00" },
        "subjects": ["Database Systems", "Algorithms"]
      },
      {
        "type": "LAB_SUBJECT_IN_NON_LAB",
        "subject": "Computer Networks Lab",
        "room": "C-101",
        "roomType": "CLASSROOM"
      }
    ]
  }
}
```

**Conflict Types:**
- `TEACHER_DOUBLE_BOOKED` - Same teacher in same slot
- `ROOM_DOUBLE_BOOKED` - Same room in same slot
- `LAB_SUBJECT_IN_NON_LAB` - Lab subject not in LAB room

---

## Delete Routine

### DELETE /api/routine/:semesterId

Permanently delete all routine entries for semester.

**Response (200):**
```json
{
  "success": true,
  "message": "Deleted 45 routine entries",
  "data": {
    "deletedCount": 45,
    "semesterId": "uuid"
  }
}
```

---

## Deactivate Routine

### PATCH /api/routine/:semesterId/deactivate

Soft delete (set isActive=false) instead of permanent delete.

**Response (200):**
```json
{
  "success": true,
  "message": "Deactivated 45 routine entries",
  "data": {
    "deactivatedCount": 45,
    "semesterId": "uuid"
  }
}
```

---

## RBAC Summary

| Endpoint | ADMIN | TEACHER | STUDENT |
|----------|-------|---------|---------|
| `POST /generate` | ✓ | ✗ | ✗ |
| `GET /preview/:id` | ✓ | ✗ | ✗ |
| `DELETE /:id` | ✓ | ✗ | ✗ |
| `PATCH /:id/deactivate` | ✓ | ✗ | ✗ |
| `GET /:id/validate` | ✓ | ✗ | ✗ |
| `GET /:id` | ✓ | ✓ | ✓ |
| `GET /:id/day/:day` | ✓ | ✓ | ✓ |
| `GET /:id/teacher/:id` | ✓ | Own only | ✗ |
| `GET /:id/student` | ✓ | ✓ | ✓ |

---

## Example: Complete Workflow

### Step 1: Check Prerequisites
```bash
# Verify all subjects have teachers assigned
GET /api/routine/preview/:semesterId
```

### Step 2: Set Teacher Availability (if needed)
```bash
# Block teachers who are unavailable
POST /api/availability/teacher
{
  "teacherId": "uuid",
  "timeSlotId": "uuid",
  "status": "BUSY",
  "notes": "Department meeting"
}
```

### Step 3: Set Room Availability (if needed)
```bash
# Block rooms under maintenance
POST /api/availability/room
{
  "roomId": "uuid",
  "timeSlotId": "uuid",
  "status": "BUSY",
  "notes": "Maintenance work"
}
```

### Step 4: Generate Routine
```bash
POST /api/routine/generate
{
  "semesterId": "uuid",
  "academicYear": "2024-2025",
  "preferSpreadAcrossDays": true,
  "prioritizeLabs": true
}
```

### Step 5: Verify Result
```bash
# Check generated routine
GET /api/routine/:semesterId

# Validate no conflicts
GET /api/routine/:semesterId/validate
```

---

## Troubleshooting

### Generation Fails

**Symptoms:**
- "Unable to generate valid routine with current constraints"

**Common Causes:**
1. **Not enough teachers** - Some subjects have no assigned teachers
2. **Not enough rooms** - Insufficient lab rooms for lab subjects
3. **Over-constrained availability** - Too many teachers/rooms marked BUSY
4. **Too many subjects** - More hours than available slots

**Solutions:**
1. Check preview: `GET /api/routine/preview/:semesterId`
2. Verify teacher assignments
3. Reduce BUSY constraints
4. Add more rooms or time slots

### Slow Generation

**Optimization Tips:**
1. Reduce maxIterations if constraints are tight
2. Ensure subjects have limited teacher assignments (not all teachers)
3. Pre-assign some subjects manually to reduce search space

---

## Files Structure

```
src/features/routine/
├── routine.generator.js    # Core backtracking algorithm
├── routine.service.js      # Orchestration & transactions
├── routine.repository.js   # Database queries
├── routine.controller.js   # HTTP handlers
├── routine.routes.js       # Route definitions
└── routine.validation.js   # Zod schemas
```

---

## Algorithm Details

### Backtracking Complexity

- **Worst Case:** O(n^m) where n = options per slot, m = sessions
- **Typical:** Much faster due to early constraint pruning
- **Limit:** 10,000 iterations default (configurable)

### Constraint Checking Order

1. Teacher BUSY status (fast lookup)
2. Room BUSY status (fast lookup)
3. Current schedule conflicts (in-memory map)
4. Teacher availability API (if needed)
5. Room availability API (if needed)

### Optimizations

1. **Lab subjects first** - Harder to place, handled early
2. **High-hour subjects first** - More constraints, placed early
3. **Spread preference** - Distribute same subject across days
4. **In-memory maps** - O(1) conflict checking
5. **Early termination** - Stop when max iterations reached
