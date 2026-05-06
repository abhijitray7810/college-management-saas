// Enums
export {
  dayEnum,
  roomTypeEnum,
  availabilityStatusEnum,
  attendanceStatusEnum,
  routineStatusEnum,
} from './enums.js';

// Roles
export { ROLES, DEFAULT_ROLE, ROLE_HIERARCHY, PERMISSIONS } from './roles.js';

// User
export { users, roleEnum } from './user.schema.js';

// Infrastructure (Building Hierarchy)
export { buildings, buildingsRelations } from './building.schema.js';
export { floors, floorsRelations } from './floor.schema.js';
export { rooms, roomsRelations } from './room.schema.js';

// Academic Structure
export { departments, departmentsRelations } from './department.schema.js';
export { courses, coursesRelations } from './course.schema.js';
export { semesters, semestersRelations } from './semester.schema.js';
export { batches, batchesRelations } from './batch.schema.js';
export { sections, sectionsRelations } from './section.schema.js';
export { subjects, subjectsRelations } from './subject.schema.js';

// User Extensions
export { teachers, teachersRelations } from './teacher.schema.js';
export { students, studentsRelations } from './student.schema.js';

// Junction Tables
export { teacherSubjects, teacherSubjectsRelations } from './teacherSubject.schema.js';
export { batchSubjects, batchSubjectsRelations } from './batchSubject.schema.js';
export { studentSections, studentSectionsRelations } from './studentSection.schema.js';

// Time System
export { timeSlots, timeSlotsRelations } from './timeSlot.schema.js';

// Availability System
export {
  teacherAvailabilities,
  teacherAvailabilitiesRelations,
  roomAvailabilities,
  roomAvailabilitiesRelations,
} from './availability.schema.js';

// Routine System
export { routines, routinesRelations } from './routine.schema.js';

// Attendance System
export {
  attendanceSessions,
  attendanceSessionsRelations,
  attendanceRecords,
  attendanceRecordsRelations,
} from './attendance.schema.js';
