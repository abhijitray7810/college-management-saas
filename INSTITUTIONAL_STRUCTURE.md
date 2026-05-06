# College Management SaaS - Institutional Structure Redesign

## Executive Summary

This document describes the comprehensive redesign of the College Management SaaS to support a real-world institutional structure with hierarchical role-based access control.

---

## 1. Role Hierarchy

```
SUPER_ADMIN (Level 4)
    ↓
ADMIN / HOD (Level 3)
    ↓
TEACHER (Level 2)
    ↓
STUDENT (Level 1)
```

### Responsibilities

| Role | Scope | Key Responsibilities |
|------|-------|---------------------|
| **SUPER_ADMIN** | System-wide | Create buildings, floors, departments, assign HODs, manage infrastructure |
| **ADMIN (HOD)** | Department-level | Manage teachers, batches, sections, subjects, generate routines |
| **TEACHER** | Teaching operations | View schedules, mark attendance, manage assigned classes |
| **STUDENT** | Personal data | View routine, check attendance, personal dashboard |

---

## 2. Infrastructure Model (Building Hierarchy)

```
Building
    ↓
Floors (can be assigned to departments)
    ↓
Rooms (CLASSROOM, LAB, SEMINAR_HALL, AUDITORIUM)
```

### Tables

| Table | Managed By | Key Fields |
|-------|-----------|------------|
| `buildings` | SUPER_ADMIN | id, name, code, address |
| `floors` | SUPER_ADMIN | building_id, floor_number, department_id (optional) |
| `rooms` | SUPER_ADMIN | floor_id, code, name, type, capacity |

---

## 3. Academic Structure

```
Department
    ↓
Batches (1st Year, 2nd Year, 3rd Year, 4th Year)
    ↓
Sections (A, B, C)
    ↓
Students
```

### Department

| Field | Description |
|-------|-------------|
| id | UUID |
| code | Short code (e.g., "CSE", "MECH") |
| name | Full name (e.g., "Computer Science") |
| hod_id | Assigned HOD (user with ADMIN role) |

### Batch

| Field | Description |
|-------|-------------|
| id | UUID |
| department_id | Parent department |
| year | Academic year (1, 2, 3, 4) |
| academic_year | Session (e.g., "2023-2024") |
| name | Display name |

### Section

| Field | Description |
|-------|-------------|
| id | UUID |
| batch_id | Parent batch |
| name | Section letter (A, B, C) |
| capacity | Maximum students |

### Student Assignment (Junction Table: student_sections)

Links students to both batch and section:

```sql
student_id + section_id + batch_id
```

---

## 4. Subject & Teacher Assignment

### Subject Model

Subjects belong to departments:

```sql
subjects: id, department_id, code, name, credits, is_lab, hours_per_week
```

### Batch-Subject Assignment (Junction Table: batch_subjects)

Defines which subjects are taught in which batch:

```sql
batch_id + subject_id + hours_per_week
```

### Teacher-Subject Assignment (Junction Table: teacher_subjects)

Defines which teachers can teach which subjects:

```sql
teacher_id + subject_id
```

---

## 5. Teacher Model

Teachers belong to departments:

```sql
teachers: id, user_id, department_id, employee_id, designation, 
          specialization, qualification, experience_years
```

### Teacher Availability

Stored in `teacher_availabilities`:

```javascript
{
  teacher_id: UUID,
  day: "MONDAY",
  start_time: "08:00",
  end_time: "16:00",
  status: "AVAILABLE" | "BUSY" | "BOOKED"
}
```

---

## 6. Routine Structure

Routines link all entities together:

```sql
routines: 
  id,
  -- Academic Hierarchy
  department_id,
  batch_id,
  section_id,
  -- Assignment
  subject_id,
  teacher_id,
  room_id,
  time_slot_id,
  -- Scheduling
  academic_year,
  week_number,
  is_recurring,
  effective_from,
  effective_until,
  -- Status
  is_active,
  is_locked,
  is_manual,
  status (DRAFT, PENDING, APPROVED, ACTIVE)
```

### Constraints (Prevent Conflicts)

1. **Teacher-Slot**: A teacher can only be in one place at a time
2. **Room-Slot**: A room can only host one class at a time
3. **Section-Slot**: A section can only have one subject at a time

---

## 7. Attendance Flow

```
Routine Entry
    ↓
Attendance Session (created by teacher)
    ↓
Section Students (auto-populated)
    ↓
Attendance Records (marked by teacher)
```

---

## 8. API Endpoints

### Infrastructure (SUPER_ADMIN only)

```
POST   /api/buildings              Create building
GET    /api/buildings              List buildings
GET    /api/buildings/:id          Get building with floors
PATCH  /api/buildings/:id          Update building
DELETE /api/buildings/:id          Delete building

POST   /api/floors                 Create floor
GET    /api/floors                 List floors
GET    /api/floors/:id             Get floor with rooms
PATCH  /api/floors/:id/assign-department  Assign to department
PATCH  /api/floors/:id             Update floor
DELETE /api/floors/:id             Delete floor
```

### Academic Structure (SUPER_ADMIN and ADMIN)

```
POST   /api/batches                Create batch
GET    /api/batches                List batches (HOD: department only)
GET    /api/batches/:id            Get batch with sections/subjects
POST   /api/batches/:id/subjects   Assign subjects
DELETE /api/batches/:id/subjects/:subjectId  Remove subject
PATCH  /api/batches/:id            Update batch
DELETE /api/batches/:id            Delete batch

POST   /api/sections               Create section
GET    /api/sections               List sections (HOD: department only)
GET    /api/sections/:id           Get section with students
POST   /api/sections/:id/students  Assign students
DELETE /api/sections/:id/students/:studentId  Remove student
PATCH  /api/sections/:id            Update section
DELETE /api/sections/:id            Delete section
```

---

## 9. HOD Responsibilities

### Dashboard Features

1. **Manage Teachers**
   - Add teachers to department
   - Define availability schedules
   - Assign subjects to teachers

2. **Manage Academic Structure**
   - Create batches (year-wise)
   - Create sections (A, B, C)
   - Assign students to sections

3. **Manage Curriculum**
   - Add subjects
   - Assign subjects to batches
   - Define hours per week

4. **Generate Routines**
   - Generate for department
   - Manual override (swap, lock, edit)
   - Submit for approval (if required)

---

## 10. SUPER_ADMIN Panel

### Infrastructure Management

1. **Buildings**
   - Create/edit buildings
   - View building statistics

2. **Floors**
   - Create floors in buildings
   - Assign floors to departments
   - View floor occupancy

3. **Rooms**
   - Create rooms (CLASSROOM, LAB, etc.)
   - Set capacity and amenities
   - View room availability

### Department Management

1. **Create Departments**
2. **Assign HODs** (promote user to ADMIN role)
3. **View System-wide Statistics**

---

## 11. Database Schema Changes Summary

### New Tables

1. `buildings` - Infrastructure
2. `floors` - Building floors
3. `batches` - Academic batches
4. `sections` - Batch sections
5. `student_sections` - Student-to-section assignments
6. `batch_subjects` - Batch-to-subject assignments

### Updated Tables

1. `roles` - Added SUPER_ADMIN, PERMISSIONS
2. `users` - Added SUPER_ADMIN to role enum
3. `departments` - Added hod_id
4. `teachers` - Added department_id
5. `students` - Replaced semester_id with batch_id
6. `subjects` - Changed from semester_id to department_id
7. `rooms` - Changed from floor/building fields to floor_id
8. `routines` - Added department_id, batch_id, section_id

### Relationships

```javascript
// Building → Floors → Rooms
buildings.hasMany(floors)
floors.belongsTo(buildings)
floors.hasMany(rooms)
floors.belongsTo(departments) // Optional assignment
rooms.belongsTo(floors)

// Department → Batches → Sections
departments.hasMany(batches)
departments.hasMany(subjects)
departments.hasMany(teachers)
batches.belongsTo(departments)
batches.hasMany(sections)
batches.belongsToMany(subjects, { through: batch_subjects })
sections.belongsTo(batches)
sections.belongsToMany(students, { through: student_sections })

// Teachers
teachers.belongsTo(departments)
teachers.belongsToMany(subjects, { through: teacher_subjects })

// Students
students.belongsTo(batches)
students.belongsToMany(sections, { through: student_sections })

// Routines
routines.belongsTo(departments)
routines.belongsTo(batches)
routines.belongsTo(sections)
routines.belongsTo(subjects)
routines.belongsTo(teachers)
routines.belongsTo(rooms)
```

---

## 12. Implementation Status

| Component | Status | Files |
|-----------|--------|-------|
| Schema Updates | ✅ Complete | `src/db/schema/*.js` |
| Building Service | ✅ Complete | `src/features/buildings/` |
| Floor Service | ✅ Complete | `src/features/floors/` |
| Batch Service | ✅ Complete | `src/features/batches/` |
| Section Service | ✅ Complete | `src/features/sections/` |
| Routes | ✅ Complete | `*.routes.js` |
| App Integration | ✅ Complete | `src/app.js` |

---

## 13. Migration Notes

### For Existing Data

1. **Students**: Migrate from `current_semester_id` to `batch_id` + `student_sections`
2. **Subjects**: Migrate from `semester_id` to `department_id` + `batch_subjects`
3. **Rooms**: Create floors/buildings first, then migrate rooms
4. **Routines**: Add department_id, batch_id, section_id columns

### Seed Data Recommended

1. SUPER_ADMIN user
2. Initial building with floors
3. Sample departments with HODs
4. Sample batches and sections
5. Time slots

---

## 14. Security Considerations

1. **Role-based Access**: All new endpoints properly protected
2. **Department Isolation**: HODs can only access their department data
3. **Validation**: Duplicate checks on all unique fields
4. **Soft Deletes**: All entities support soft delete
5. **Audit Trail**: created_at, updated_at on all tables

---

## 15. Next Steps

1. Run database migrations
2. Seed initial data (SUPER_ADMIN, buildings, time slots)
3. Update frontend to support new structure
4. Create SUPER_ADMIN panel UI
5. Enhance HOD dashboard
6. Update routine generator algorithm
7. Test all endpoints with proper authorization

---

**Document Version**: 1.0  
**Last Updated**: May 5, 2026  
**Author**: Senior Backend System Architect
