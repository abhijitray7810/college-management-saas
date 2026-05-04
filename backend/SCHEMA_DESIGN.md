# College Management SaaS - Database Schema Design

## Overview

This document describes the production-grade PostgreSQL database schema for the College Management System with Routine Generator.

**Current Status**: Single-tenant (one college)
**Future Ready**: Designed for easy multi-tenant extension

---

## Schema Files

```
src/db/schema/
├── enums.js                    # PostgreSQL enums
├── roles.js                    # Role constants
├── user.schema.js              # Base users table
├── department.schema.js        # Academic departments
├── course.schema.js            # Courses/programs
├── semester.schema.js          # Semesters/terms
├── subject.schema.js           # Subjects/courses
├── teacher.schema.js           # Teacher profiles
├── student.schema.js           # Student profiles
├── teacherSubject.schema.js    # Teacher-subject assignments
├── room.schema.js              # Classrooms & labs
├── timeSlot.schema.js          # Time slots
├── availability.schema.js      # Teacher & room availability
├── routine.schema.js           # Timetable/routine entries
├── attendance.schema.js        # Attendance tracking
└── index.js                    # Central exports
```

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  departments    │────▶│    courses      │────▶│   semesters     │
│    (1)          │     │    (N)          │     │    (N)          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    subjects     │◄────│ teacher_subjects│◄────│    teachers     │
│    (N)          │     │   (junction)    │     │    (1)          │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                             │
         │         ┌─────────────────┐                  │
         │         │    routines     │◄─────────────────┘
         │         │   (timetable)   │◄─────────────────┐
         │         └────────┬────────┘                  │
         │                  │                          │
         └──────────────────┘                  ┌────────┴────────┐
                                               │     rooms       │
                                               │    (1)          │
                                               └─────────────────┘
                                                        ▲
                                               ┌────────┴────────┐
                                               │   time_slots    │
                                               └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │────▶│    students     │◄────│ attendance_     │
│  (base auth)    │     │   (profiles)    │     │   records       │
└─────────────────┘     └─────────────────┘     └────────▲────────┘
                                                        │
                                               ┌────────┴────────┐
                                               │ attendance_     │
                                               │   sessions      │
                                               │ (class events)  │
                                               └─────────────────┘
```

---

## Key Design Decisions

### 1. Normalization (3NF)

- **No redundant data**: All entities are properly separated
- **Junction tables**: Many-to-many relationships use junction tables
- **Foreign keys**: All relationships enforced at database level

### 2. UUID Primary Keys

- All tables use `uuid` with `defaultRandom()`
- Benefits:
  - Globally unique (safe for multi-tenant future)
  - No sequential ID exposure
  - Easy to merge data across instances

### 3. Timestamps

Every table includes:
- `created_at` - Record creation time
- `updated_at` - Last modification time

### 4. Foreign Key Constraints

| Relationship | ON DELETE |
|--------------|-----------|
| Parent → Children | `CASCADE` |
| Optional References | `SET NULL` |
| System Critical | `RESTRICT` |

### 5. Indexes

Strategic indexes on:
- Foreign keys (for joins)
- Unique codes/identifiers
- Frequently queried fields
- Composite unique constraints

### 6. Composite Unique Constraints

Critical for data integrity:

| Table | Constraint | Purpose |
|-------|------------|---------|
| `semesters` | (course_id, semester_number, academic_year) | No duplicate semesters |
| `subjects` | (semester_id, code) | Unique subject per semester |
| `teacher_subjects` | (teacher_id, subject_id) | No duplicate assignments |
| `time_slots` | (day, slot_number) | Unique time slots |
| `teacher_availabilities` | (teacher_id, time_slot_id) | No duplicate availability |
| `room_availabilities` | (room_id, time_slot_id) | No duplicate availability |
| `routines` | (teacher_id, time_slot_id) | **Prevent double booking** |
| `routines` | (room_id, time_slot_id) | **Prevent double booking** |
| `attendance_records` | (session_id, student_id) | One record per student per session |

---

## Tables Reference

### Academic Structure

#### departments
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | varchar(20) | Unique department code (e.g., "CSE") |
| name | varchar(255) | Department name |
| description | text | Optional description |

#### courses
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| department_id | uuid | FK → departments |
| code | varchar(20) | Unique course code |
| name | varchar(255) | Course name |
| duration_years | integer | Program duration |
| total_semesters | integer | Total semesters |

#### semesters
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| course_id | uuid | FK → courses |
| name | varchar(100) | Semester name |
| semester_number | integer | 1, 2, 3... |
| academic_year | varchar(20) | e.g., "2024-2025" |
| start_date | timestamp | Semester start |
| end_date | timestamp | Semester end |
| is_active | boolean | Currently active |

#### subjects
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| semester_id | uuid | FK → semesters |
| code | varchar(20) | Subject code |
| name | varchar(255) | Subject name |
| credits | integer | Credit hours |
| is_lab | boolean | Lab or theory |
| hours_per_week | integer | Weekly hours |

### User Extensions

#### teachers
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK → users (1:1) |
| employee_id | varchar(50) | Unique employee ID |
| designation | varchar(100) | Professor, Lecturer, etc. |
| specialization | text | Subject expertise |
| qualification | text | Education details |
| experience_years | integer | Years of experience |

#### students
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK → users (1:1) |
| roll_number | varchar(50) | Unique roll number |
| enrollment_number | varchar(50) | Unique enrollment ID |
| current_semester_id | uuid | FK → semesters |
| guardian_name | varchar(255) | Parent/guardian |
| guardian_contact | varchar(20) | Contact number |
| address | text | Address |

### Infrastructure

#### rooms
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | varchar(20) | Room code (e.g., "LAB-101") |
| name | varchar(255) | Room name |
| type | enum | CLASSROOM, LAB, SEMINAR_HALL, AUDITORIUM |
| capacity | integer | Seating capacity |
| floor | integer | Floor number |
| building | varchar(100) | Building name |
| has_projector | boolean | Projector available |
| has_ac | boolean | AC available |

#### time_slots
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| day | enum | MONDAY - SATURDAY |
| start_time | time | Start time (HH:MM:SS) |
| end_time | time | End time (HH:MM:SS) |
| slot_number | integer | Slot sequence number |
| is_active | boolean | Available for scheduling |

### Routine System

#### routines (Timetable)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| semester_id | uuid | FK → semesters |
| subject_id | uuid | FK → subjects |
| teacher_id | uuid | FK → teachers |
| room_id | uuid | FK → rooms |
| time_slot_id | uuid | FK → time_slots |
| academic_year | varchar(20) | e.g., "2024-2025" |
| week_number | integer | Specific week (optional) |
| is_recurring | boolean | Weekly recurring |
| effective_from | timestamp | Valid from date |
| effective_until | timestamp | Valid until date |
| is_active | boolean | Currently scheduled |

**Unique Constraints:**
- (teacher_id, time_slot_id) - Prevents teacher double booking
- (room_id, time_slot_id) - Prevents room double booking

### Availability System

#### teacher_availabilities
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| teacher_id | uuid | FK → teachers |
| time_slot_id | uuid | FK → time_slots |
| status | enum | AVAILABLE, BUSY, BOOKED |
| valid_from | timestamp | Validity start |
| valid_until | timestamp | Validity end |

#### room_availabilities
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | FK → rooms |
| time_slot_id | uuid | FK → time_slots |
| status | enum | AVAILABLE, BUSY, BOOKED |

### Attendance System

#### attendance_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| routine_id | uuid | FK → routines |
| teacher_id | uuid | FK → teachers (conducting) |
| time_slot_id | uuid | FK → time_slots |
| session_date | timestamp | Class date |
| topic_covered | varchar(255) | What was taught |
| is_cancelled | boolean | Class cancelled |
| cancellation_reason | text | Why cancelled |
| marked_by | uuid | FK → teachers (who marked) |
| marked_at | timestamp | When marked |

#### attendance_records
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | FK → attendance_sessions |
| student_id | uuid | FK → students |
| status | enum | PRESENT, ABSENT, LATE, EXCUSED |
| remarks | text | Notes |

**Unique Constraint:** (session_id, student_id) - One record per student per session

---

## Enums

### day
- MONDAY
- TUESDAY
- WEDNESDAY
- THURSDAY
- FRIDAY
- SATURDAY

### room_type
- CLASSROOM
- LAB
- SEMINAR_HALL
- AUDITORIUM

### availability_status
- AVAILABLE
- BUSY
- BOOKED

### attendance_status
- PRESENT
- ABSENT
- LATE
- EXCUSED

### role (existing)
- ADMIN
- TEACHER
- STUDENT

---

## Multi-Tenant Extension Strategy

To convert to multi-tenant SaaS later:

1. **Add `organizations` table**:
   ```sql
   CREATE TABLE organizations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name varchar(255) NOT NULL,
     subdomain varchar(100) UNIQUE NOT NULL,
     -- ... other org fields
   );
   ```

2. **Add `organization_id` to key tables**:
   - departments
   - courses
   - rooms
   - users (with global admin override)

3. **Add composite indexes**:
   ```sql
   CREATE INDEX idx_departments_org ON departments(organization_id);
   CREATE UNIQUE INDEX idx_departments_org_code 
     ON departments(organization_id, code);
   ```

4. **Update queries** to always filter by `organization_id`

---

## Sample Time Slots

Typical daily schedule:

| Slot # | Day | Start | End |
|--------|-----|-------|-----|
| 1 | MON-SAT | 09:00 | 10:00 |
| 2 | MON-SAT | 10:00 | 11:00 |
| 3 | MON-SAT | 11:00 | 12:00 |
| 4 | MON-SAT | 12:00 | 13:00 |
| BREAK | - | 13:00 | 14:00 |
| 5 | MON-SAT | 14:00 | 15:00 |
| 6 | MON-SAT | 15:00 | 16:00 |
| 7 | MON-SAT | 16:00 | 17:00 |

---

## Usage Examples

### Create a Department
```javascript
await db.insert(departments).values({
  code: 'CSE',
  name: 'Computer Science & Engineering',
});
```

### Assign Teacher to Subject
```javascript
await db.insert(teacherSubjects).values({
  teacherId: teacherUuid,
  subjectId: subjectUuid,
  isPrimary: true,
});
```

### Create Routine Entry
```javascript
await db.insert(routines).values({
  semesterId: semesterUuid,
  subjectId: subjectUuid,
  teacherId: teacherUuid,
  roomId: roomUuid,
  timeSlotId: timeSlotUuid,
  academicYear: '2024-2025',
  isRecurring: true,
});
```

### Mark Attendance
```javascript
// Create session
const session = await db.insert(attendanceSessions).values({
  routineId: routineUuid,
  teacherId: teacherUuid,
  timeSlotId: timeSlotUuid,
  sessionDate: new Date(),
  topicCovered: 'Introduction to Database Design',
}).returning();

// Mark students
await db.insert(attendanceRecords).values([
  { sessionId: session[0].id, studentId: student1Uuid, status: 'PRESENT' },
  { sessionId: session[0].id, studentId: student2Uuid, status: 'ABSENT' },
]);
```

---

## Performance Considerations

1. **Indexes are on**: All foreign keys, unique codes, and search fields
2. **Composite indexes**: For common query patterns
3. **Soft deletes**: Use `is_active` flags instead of hard deletes
4. **Pagination**: Always paginate list queries
5. **Connection pooling**: Configured in `src/config/db.js`

---

## Migration Commands

```bash
# Push schema to database
npm run db:push

# Generate migration files (for version control)
npm run db:generate

# Open Drizzle Studio GUI
npm run db:studio
```

---

## Next Steps

1. Run `npm install` to ensure all dependencies
2. Configure `.env` with DATABASE_URL
3. Run `npm run db:push` to create tables
4. Seed initial data (time slots, rooms, departments)
5. Build API endpoints for each feature
