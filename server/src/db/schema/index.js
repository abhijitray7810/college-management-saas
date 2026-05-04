// Enums
export {
  dayEnum,
  roomTypeEnum,
  availabilityStatusEnum,
  attendanceStatusEnum,
} from './enums.js';

// Roles (existing)
export { ROLES, DEFAULT_ROLE, ROLE_HIERARCHY } from './roles.js';

// User (existing)
export { users, roleEnum } from './user.schema.js';

// Academic Structure
export { departments, departmentsRelations } from './department.schema.js';
export { courses, coursesRelations } from './course.schema.js';
export { semesters, semestersRelations } from './semester.schema.js';
export { subjects, subjectsRelations } from './subject.schema.js';

// User Extensions
export { teachers, teachersRelations } from './teacher.schema.js';
export { students, studentsRelations } from './student.schema.js';

// Mappings
export { teacherSubjects, teacherSubjectsRelations } from './teacherSubject.schema.js';

// Infrastructure
export { rooms, roomsRelations } from './room.schema.js';

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
