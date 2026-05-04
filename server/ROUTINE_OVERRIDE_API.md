# Routine Manual Override API Documentation

Production-grade manual override system for the Routine Generator.

## Overview

The Manual Override System allows administrators to:
- **Edit routine entries** - Change teacher, room, or time slot
- **Swap sessions** - Exchange all attributes between two routines
- **Lock/Unlock routines** - Prevent accidental modifications

**Key Principles:**
- Locked routines cannot be modified
- All changes are tracked (is_manual, updated_by, updated_at)
- Conflicts are strictly prevented
- Transaction-based operations for data integrity

## Database Changes

New fields added to `routines` table:

```sql
is_locked BOOLEAN DEFAULT false
is_manual BOOLEAN DEFAULT false
updated_by UUID REFERENCES users(id)
```

## API Endpoints

### Base URL
```
/api/routine
```

---

## 1. Update Routine Entry

### PATCH /api/routine/update/:id

Update specific fields of a routine entry.

**Request:**
```http
PATCH /api/routine/update/routine-uuid
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "teacherId": "new-teacher-uuid",
  "roomId": "new-room-uuid",
  "timeSlotId": "new-slot-uuid",
  "notes": "Changed due to teacher availability"
}
```

**Rules:**
- Cannot update if `is_locked = true`
- Must pass conflict checks (teacher/room availability)
- At least one field must change
- Sets `is_manual = true` and `updated_by` automatically

**Success Response (200):**
```json
{
  "success": true,
  "message": "Routine updated successfully",
  "data": {
    "id": "routine-uuid",
    "semesterId": "semester-uuid",
    "subjectId": "subject-uuid",
    "teacherId": "new-teacher-uuid",
    "roomId": "new-room-uuid",
    "timeSlotId": "new-slot-uuid",
    "isManual": true,
    "updatedBy": "admin-user-uuid",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (403):** Locked routine
```json
{
  "success": false,
  "message": "Cannot update locked routine"
}
```

**Error Response (409):** Conflict detected
```json
{
  "success": false,
  "message": "Teacher is already assigned to another routine at this time slot"
}
```

---

## 2. Swap Two Routine Slots

### POST /api/routine/swap

Exchange teacher, room, and time slot between two routines.

**Request:**
```http
POST /api/routine/swap
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "routineId1": "routine-uuid-1",
  "routineId2": "routine-uuid-2"
}
```

**Rules:**
- Both routines must exist
- Neither can be locked
- No conflicts after swap
- Transaction-based (all or nothing)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Routines swapped successfully",
  "data": {
    "routineId1": "routine-uuid-1",
    "routineId2": "routine-uuid-2",
    "swapped": true
  }
}
```

**Error Response (403):** One or both locked
```json
{
  "success": false,
  "message": "Cannot swap locked routines"
}
```

---

## 3. Lock / Unlock Routine

### PATCH /api/routine/lock/:id

Toggle lock status of a routine.

**Request:**
```http
PATCH /api/routine/lock/routine-uuid
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isLocked": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Routine locked successfully",
  "data": {
    "id": "routine-uuid",
    "isLocked": true,
    "updatedBy": "admin-user-uuid",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 4. Bulk Lock / Unlock

### POST /api/routine/lock/bulk

Lock or unlock all routines in a semester.

**Request:**
```http
POST /api/routine/lock/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "semesterId": "semester-uuid",
  "isLocked": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "45 routines locked successfully",
  "data": {
    "affectedCount": 45,
    "semesterId": "semester-uuid",
    "isLocked": true
  }
}
```

---

## 5. Get Routine Details

### GET /api/routine/detail/:id

Get detailed information about a specific routine.

**Request:**
```http
GET /api/routine/detail/routine-uuid
Authorization: Bearer <admin_or_teacher_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "routine-uuid",
    "semesterId": "semester-uuid",
    "subject": {
      "id": "subject-uuid",
      "name": "Database Systems",
      "code": "CS301"
    },
    "teacher": {
      "id": "teacher-uuid",
      "user": { "name": "Dr. John Doe" }
    },
    "room": {
      "id": "room-uuid",
      "code": "C-101",
      "name": "Classroom 101"
    },
    "timeSlot": {
      "id": "slot-uuid",
      "day": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "10:00:00"
    },
    "isLocked": false,
    "isManual": true,
    "updatedBy": "admin-user-uuid",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## RBAC Summary

| Endpoint | ADMIN | TEACHER | STUDENT |
|----------|-------|---------|---------|
| `PATCH /update/:id` | ✓ | ✗ | ✗ |
| `POST /swap` | ✓ | ✗ | ✗ |
| `PATCH /lock/:id` | ✓ | ✗ | ✗ |
| `POST /lock/bulk` | ✓ | ✗ | ✗ |
| `GET /detail/:id` | ✓ | ✓ | ✗ |

---

## Conflict Detection Logic

### Update Routine
```
1. Check if routine is locked → BLOCK
2. Check if any field is changing → BLOCK if no changes
3. Check teacher availability at new slot → BLOCK if conflict
4. Check room availability at new slot → BLOCK if conflict
5. Check availability service for BUSY status → BLOCK if conflict
6. Apply update with is_manual=true
```

### Swap Routines
```
1. Check if either routine is locked → BLOCK
2. Check Routine 1's teacher at Routine 2's slot → BLOCK if conflict
3. Check Routine 1's room at Routine 2's slot → BLOCK if conflict
4. Check Routine 2's teacher at Routine 1's slot → BLOCK if conflict
5. Check Routine 2's room at Routine 1's slot → BLOCK if conflict
6. Execute swap in transaction
```

---

## Example Workflow

### Scenario: Change Teacher Due to Emergency

```bash
# 1. Get routine details
GET /api/routine/detail/routine-uuid

# 2. Check available teachers for the time slot
GET /api/availability/teachers/free/time-slot-uuid

# 3. Update routine with new teacher
PATCH /api/routine/update/routine-uuid
{
  "teacherId": "new-teacher-uuid",
  "notes": "Emergency change - original teacher sick"
}

# 4. Lock the routine to prevent accidental changes
PATCH /api/routine/lock/routine-uuid
{
  "isLocked": true
}
```

### Scenario: Swap Two Class Sessions

```bash
# 1. Swap two routines
POST /api/routine/swap
{
  "routineId1": "routine-uuid-1",
  "routineId2": "routine-uuid-2"
}

# Both routines now have each other's:
# - teacher
# - room
# - time slot
```

### Scenario: Lock All Finals Week Sessions

```bash
# Lock all routines for the semester
POST /api/routine/lock/bulk
{
  "semesterId": "semester-uuid",
  "isLocked": true
}

# Response: 50 routines locked successfully
```

---

## Files Modified

```
src/db/schema/routine.schema.js     # Added is_locked, is_manual, updated_by
src/features/routine/
├── routine.validation.js          # Added override schemas
├── routine.repository.js          # Added CRUD + swap methods
├── routine.service.js             # Added override business logic
├── routine.controller.js            # Added override endpoints
└── routine.routes.js              # Added override routes
```

---

## Error Codes

| Code | Scenario |
|------|----------|
| 400 | No changes detected, invalid input |
| 403 | Routine is locked, insufficient permissions |
| 404 | Routine not found |
| 409 | Teacher/room conflict, availability conflict |
| 500 | Database error, transaction failure |
