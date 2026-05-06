# Seed Script & Section-Based Routine Generator

## 📦 Files Created/Updated

### 1. Seed Script
**File**: `scripts/seed.js`

Creates complete demo data for the institutional structure:

| Entity | Count | Details |
|--------|-------|---------|
| **Users** | 53 | 1 SUPER_ADMIN, 2 HODs, 10 Teachers, 40 Students |
| **Departments** | 2 | CSE, ECE |
| **Building** | 1 | Academic Block A with 3 floors |
| **Rooms** | 21 | 15 classrooms, 6 labs |
| **Batches** | 8 | 4 per department (Year 1-4) |
| **Sections** | 16 | 2 per batch (A, B) |
| **Subjects** | 12 | 6 per department |
| **Time Slots** | 48 | 6 days × 8 slots |
| **Availability** | ~50 | Random realistic schedules |

### 2. Updated Routine Generator
**File**: `src/features/routine/routine.generator.js`

Completely rewritten for section-based scheduling with:

- **Hierarchical data loading**: section → batch → department
- **Batch-based subjects**: Via `batch_subjects` table
- **Department-filtered rooms**: From department-assigned floors
- **Preloaded data**: All availability cached in memory
- **NEW constraint**: Section cannot be double-booked
- **Performance optimized**: Zero DB calls inside backtracking loop

### 3. API Updates

#### New Endpoint
```
POST /api/routine/generate/section
```

**Request Body**:
```json
{
  "sectionId": "uuid",
  "academicYear": "2024-2025",
  "preferSpreadAcrossDays": true,
  "prioritizeLabs": true,
  "maxIterations": 10000,
  "saveToDatabase": true
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Section routine generated successfully",
  "sectionId": "uuid",
  "data": {
    "totalSessions": 20,
    "assignedSessions": 20,
    "iterations": 450,
    "assignments": [...],
    "savedRoutines": 20
  }
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "sectionId": "uuid",
  "message": "Unable to generate valid routine with current constraints",
  "totalSessions": 20,
  "assignedSessions": 15,
  "iterations": 10000
}
```

---

## 🚀 How to Run

### Step 1: Run Database Migrations

```bash
cd server
npm run db:push
```

### Step 2: Run Seed Script

```bash
npm run seed
```

This will:
1. Create all users with proper roles
2. Set up infrastructure (building, floors, rooms)
3. Create departments with HODs
4. Build academic structure (batches, sections)
5. Assign students to sections
6. Create subjects and assign to batches
7. Link teachers to subjects
8. Generate time slots
9. Add teacher availability

### Step 3: Login Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **SUPER_ADMIN** | superadmin@college.edu | SuperAdmin@123 |
| **HOD CSE** | hod.cse@college.edu | HodCse@123 |
| **HOD ECE** | hod.ece@college.edu | HodEce@123 |
| **Teachers** | <name>@college.edu | Teacher@123 |
| **Students** | <name>@student.college.edu | Student@123 |

### Step 4: Generate Routine

Get a section ID from the seeded data, then:

```bash
# Generate routine for a specific section
curl -X POST http://localhost:3000/api/routine/generate/section \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "sectionId": "<section-uuid>",
    "academicYear": "2024-2025",
    "saveToDatabase": true
  }'
```

---

## 🏗️ Seed Data Structure

### Hierarchy Created

```
Academic Block A (Building)
├── Ground Floor (Shared)
│   ├── 5 Classrooms (G01-G05)
│   └── 2 Labs (G06-G07)
├── First Floor (CSE Department)
│   ├── 5 Classrooms (101-105)
│   └── 2 Labs (106-107)
└── Second Floor (ECE Department)
    ├── 5 Classrooms (201-205)
    └── 2 Labs (206-207)

Departments
├── CSE (Dr. Rajesh Kumar - HOD)
│   ├── 4 Batches (1st, 2nd, 3rd, 4th Year)
│   │   └── Each: 2 Sections (A, B)
│   ├── 6 Subjects
│   └── 5 Teachers
└── ECE (Dr. Priya Sharma - HOD)
    ├── 4 Batches (1st, 2nd, 3rd, 4th Year)
    │   └── Each: 2 Sections (A, B)
    ├── 6 Subjects
    └── 5 Teachers
```

### Time Slots

| Day | Slots |
|-----|-------|
| Monday - Saturday | 08:00-17:00 (8 slots) |

**Schedule**:
- 08:00-09:00 (Slot 1)
- 09:00-10:00 (Slot 2)
- 10:00-11:00 (Slot 3)
- 11:00-12:00 (Slot 4)
- 13:00-14:00 (Slot 5) - Lunch break after
- 14:00-15:00 (Slot 6)
- 15:00-16:00 (Slot 7)
- 16:00-17:00 (Slot 8)

---

## ⚙️ Generator Algorithm

### Data Loading Phase (Once at start)

```javascript
// 1. Load section → batch → department
const section = await db.query.sections.findFirst({
  where: eq(sections.id, sectionId),
  with: { batch: { with: { department: true } } }
});

// 2. Load subjects from batch_subjects
const batchSubjects = await db.query.batchSubjects.findMany({
  where: eq(batchSubjects.batchId, batchId)
});

// 3. Load teachers from teacher_subjects
const teacherSubjects = await db.query.teacherSubjects.findMany({
  where: eq(teacherSubjects.subjectId, subjectId)
});

// 4. Load rooms from department floors
const floors = await db.query.floors.findMany({
  where: eq(floors.departmentId, departmentId)
});

// 5. Preload ALL availability data
const availability = await db.query.teacherAvailabilities.findMany({
  where: inArray(teacherAvailabilities.teacherId, teacherIds)
});
```

### Generation Phase (Backtracking)

```javascript
// For each session (subject × hours_per_week):
for (const timeSlot of timeSlots) {
  // NEW: Check section not booked
  if (!isSectionAvailable(sectionId, timeSlot.id)) continue;
  
  for (const teacher of teachers) {
    // Check teacher availability (memory lookup)
    if (!isTeacherAvailable(teacher.id, timeSlot)) continue;
    
    for (const room of suitableRooms) {
      // Check room availability (memory lookup)
      if (!isRoomAvailable(room.id, timeSlot)) continue;
      
      // All constraints satisfied!
      assign(session, teacher, room, timeSlot);
      
      // Recurse to next session
      if (await backtrack(sessionIndex + 1)) return true;
      
      // Backtrack if failed
      unassign(session, teacher, room, timeSlot);
    }
  }
}
```

### Constraints Checked

1. ✅ **Teacher not double-booked** (teacherSchedule map)
2. ✅ **Room not double-booked** (roomSchedule map)
3. ✅ **Section not double-booked** (sectionSchedule map) - **NEW**
4. ✅ **Teacher availability** (preloaded data)
5. ✅ **Room availability** (preloaded data)
6. ✅ **Lab subjects → LAB rooms** (room type filtering)

---

## 📊 Performance Characteristics

| Metric | Value |
|--------|-------|
| **DB Queries** | 6-8 (all at initialization) |
| **Memory Usage** | O(n) where n = total entities |
| **Constraint Checks** | O(1) via Map lookups |
| **Max Iterations** | 10,000 (configurable) |
| **Typical Generation Time** | 1-5 seconds |

---

## 🔧 Customization Options

### Seed Script Customization

Edit `scripts/seed.js` to change:

```javascript
// Number of students per section
const STUDENTS_PER_SECTION = 5; // Change to 30 for realistic data

// Building configuration
const BUILDING_NAME = 'Academic Block A';
const FLOORS = 3;
const ROOMS_PER_FLOOR = 7;

// Time slots
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SLOTS_PER_DAY = 8;
```

### Generator Options

```javascript
await routineGenerator.initialize(sectionId, {
  academicYear: '2024-2025',
  preferSpreadAcrossDays: true,  // Spread sessions across days
  prioritizeLabs: true,            // Schedule labs first
  maxIterations: 10000,           // Backtracking limit
});
```

---

## 🧪 Testing

### Manual Test Flow

1. **Seed the database**:
   ```bash
   npm run seed
   ```

2. **Login as HOD**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"hod.cse@college.edu","password":"HodCse@123"}'
   ```

3. **Get sections**:
   ```bash
   curl http://localhost:3000/api/sections \
     -H "Authorization: Bearer <token>"
   ```

4. **Generate routine**:
   ```bash
   curl -X POST http://localhost:3000/api/routine/generate/section \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"sectionId":"<uuid>","saveToDatabase":true}'
   ```

5. **Verify routine**:
   ```bash
   curl http://localhost:3000/api/routine/section/<section-id> \
     -H "Authorization: Bearer <token>"
   ```

---

## 🐛 Troubleshooting

### Issue: "No subjects assigned to batch"

**Cause**: Batch not linked to subjects via `batch_subjects`

**Fix**: Check seed script - subjects should be auto-assigned

### Issue: "Unable to generate valid routine"

**Possible Causes**:
1. Not enough teachers for subjects
2. Not enough rooms
3. Too many conflicts in availability
4. Iteration limit too low

**Solutions**:
1. Check `teacher_subjects` assignments
2. Add more rooms or reduce class size
3. Relax availability constraints
4. Increase `maxIterations`

### Issue: Section already has routines

**Cause**: Trying to generate when routines exist

**Fix**: Delete existing routines first:
```bash
curl -X DELETE http://localhost:3000/api/routine/section/<section-id> \
  -H "Authorization: Bearer <token>"
```

---

## 📝 API Reference

### Seed Script
```bash
npm run seed
```

### Generate Section Routine
```bash
POST /api/routine/generate/section
Authorization: Bearer <JWT>
Body: {
  "sectionId": "uuid",
  "academicYear": "2024-2025",
  "preferSpreadAcrossDays": true,
  "prioritizeLabs": true,
  "maxIterations": 10000,
  "saveToDatabase": true
}
```

### Get Section Routine
```bash
GET /api/routine/section/:sectionId
Authorization: Bearer <JWT>
```

---

**Document Version**: 1.0  
**Last Updated**: May 5, 2026
