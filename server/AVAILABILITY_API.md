# Availability System API

Production-grade availability management for College Management SaaS.

## Overview

The Availability System acts as a **constraint layer** for the routine generator. It manages:
- **Teacher availability** (manually set BUSY slots)
- **Room availability** (manually set BUSY slots)
- **BOOKED status** derived from existing routines (automatically managed)

## Business Logic

### Status Definitions

| Status | Teacher | Room | How Set |
|--------|---------|------|---------|
| **AVAILABLE** | ✓ | ✓ | Default (no record) |
| **BUSY** | ✓ | ✓ | Manually blocked by ADMIN |
| **BOOKED** | ✓ | ✓ | Auto-detected from routines |

### Conflict Detection

```
When scheduling a class:
1. Check if teacher is BUSY → BLOCK
2. Check if teacher has routine → BLOCK (BOOKED)
3. Check if room is BUSY → BLOCK
4. Check if room has routine → BLOCK (BOOKED)
5. If all clear → ALLOW
```

## API Endpoints

### Base URL
```
/api/availability
```

### Authentication
All endpoints require JWT Bearer token.

---

## Teacher Availability

### Create Teacher Availability (BUSY)
```http
POST /api/availability/teacher
Authorization: Bearer <token>
Content-Type: application/json

{
  "teacherId": "uuid",
  "timeSlotId": "uuid",
  "status": "BUSY",
  "notes": "Department meeting",
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Teacher availability created successfully",
  "data": {
    "id": "uuid",
    "teacherId": "uuid",
    "timeSlotId": "uuid",
    "status": "BUSY",
    "notes": "Department meeting",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error (409):** If record already exists for this teacher + time slot.

---

### Get Teacher Availability
```http
GET /api/availability/teacher/:teacherId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "teacherId": "uuid",
      "timeSlotId": "uuid",
      "status": "BUSY",
      "effectiveStatus": "BOOKED",
      "timeSlot": {
        "day": "MONDAY",
        "startTime": "09:00:00",
        "endTime": "10:00:00"
      },
      "routine": {
        "subjectId": "uuid",
        "roomId": "uuid"
      }
    }
  ]
}
```

**Notes:**
- `effectiveStatus` combines availability + routine status
- If teacher has a routine at this slot, `effectiveStatus` = "BOOKED"

---

### Delete Teacher Availability
```http
DELETE /api/availability/teacher/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Teacher availability deleted successfully"
}
```

---

## Room Availability

### Create Room Availability (BUSY)
```http
POST /api/availability/room
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "uuid",
  "timeSlotId": "uuid",
  "status": "BUSY",
  "notes": "Maintenance work"
}
```

**Response (201):** Same format as teacher availability.

---

### Get Room Availability
```http
GET /api/availability/room/:roomId
Authorization: Bearer <token>
```

**Response (200):** Same format as teacher availability.

---

### Delete Room Availability
```http
DELETE /api/availability/room/:id
Authorization: Bearer <token>
```

---

## Utility APIs (Critical for Routine Generator)

### Get Available Teachers for Time Slot
```http
GET /api/availability/teachers/free/:timeSlotId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timeSlot": {
      "id": "uuid",
      "day": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "10:00:00"
    },
    "totalTeachers": 25,
    "availableCount": 18,
    "busyCount": 3,
    "bookedCount": 4,
    "teachers": [
      {
        "id": "uuid",
        "employeeId": "T001",
        "designation": "Professor",
        "user": {
          "name": "Dr. John Doe",
          "email": "john@college.edu"
        },
        "status": "AVAILABLE"
      }
    ]
  }
}
```

---

### Get Available Rooms for Time Slot
```http
GET /api/availability/rooms/free/:timeSlotId?type=LAB
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by room type (CLASSROOM, LAB, SEMINAR_HALL, AUDITORIUM)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timeSlot": {
      "id": "uuid",
      "day": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "10:00:00"
    },
    "filters": {
      "type": "LAB"
    },
    "totalRooms": 10,
    "availableCount": 6,
    "busyCount": 2,
    "bookedCount": 2,
    "rooms": [
      {
        "id": "uuid",
        "code": "LAB-101",
        "name": "Computer Lab A",
        "type": "LAB",
        "capacity": 40,
        "status": "AVAILABLE"
      }
    ]
  }
}
```

---

### Check Specific Teacher Availability
```http
GET /api/availability/check/teacher/:teacherId/:timeSlotId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "reason": "BOOKED",
    "routine": {
      "id": "uuid",
      "subjectId": "uuid",
      "roomId": "uuid"
    }
  }
}
```

**OR if available:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "reason": "AVAILABLE"
  }
}
```

---

### Check Specific Room Availability
```http
GET /api/availability/check/room/:roomId/:timeSlotId
Authorization: Bearer <token>
```

---

### Check Combined Conflicts
```http
POST /api/availability/check/conflicts
Authorization: Bearer <token>
Content-Type: application/json

{
  "teacherId": "uuid",
  "roomId": "uuid",
  "timeSlotId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hasConflicts": true,
    "canSchedule": false,
    "conflicts": [
      {
        "type": "TEACHER",
        "id": "uuid",
        "reason": "BOOKED",
        "details": {
          "subjectId": "uuid",
          "roomId": "uuid"
        }
      },
      {
        "type": "ROOM",
        "id": "uuid",
        "reason": "BUSY",
        "details": {
          "id": "uuid",
          "status": "BUSY",
          "notes": "Maintenance work"
        }
      }
    ]
  }
}
```

---

## RBAC Summary

| Endpoint | ADMIN | TEACHER | STUDENT |
|----------|-------|---------|---------|
| `POST /teacher` | ✓ | ✗ | ✗ |
| `POST /room` | ✓ | ✗ | ✗ |
| `GET /teacher/:id` | ✓ | Own only | ✗ |
| `GET /room/:id` | ✓ | ✗ | ✗ |
| `DELETE /teacher/:id` | ✓ | ✗ | ✗ |
| `DELETE /room/:id` | ✓ | ✗ | ✗ |
| `GET /teachers/free/*` | ✓ | ✗ | ✗ |
| `GET /rooms/free/*` | ✓ | ✗ | ✗ |
| `GET /check/*` | ✓ | ✗ | ✗ |
| `POST /check/conflicts` | ✓ | ✗ | ✗ |

---

## Example Workflow: Routine Generation

```javascript
// Step 1: Get all free teachers for Monday 9AM slot
const teachers = await fetch('/api/availability/teachers/free/time-slot-uuid');

// Step 2: Get all free LAB rooms for same slot
const rooms = await fetch('/api/availability/rooms/free/time-slot-uuid?type=LAB');

// Step 3: Before assigning, verify no conflicts
const check = await fetch('/api/availability/check/conflicts', {
  method: 'POST',
  body: JSON.stringify({
    teacherId: selectedTeacherId,
    roomId: selectedRoomId,
    timeSlotId: timeSlotId
  })
});

// Step 4: If canSchedule=true, proceed with routine creation
if (check.data.canSchedule) {
  await createRoutine({ teacherId, roomId, timeSlotId, subjectId });
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid request / Validation error |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (record already exists) |
| 500 | Server error |

---

## Key Design Decisions

1. **BOOKED is computed, not stored** - Derived from routines table
2. **BUSY is manual only** - Set by ADMIN via availability table
3. **AVAILABLE is default** - Implied when no record exists
4. **Composite availability check** - Combines both sources for accurate status
5. **Indexed queries** - Fast lookups on teacher_id, room_id, time_slot_id

---

## Files Structure

```
src/features/availability/
├── availability.controller.js    # HTTP handlers
├── availability.service.js     # Business logic & conflict detection
├── availability.repository.js  # Database queries
├── availability.routes.js      # Route definitions
└── availability.validation.js  # Zod schemas
```
