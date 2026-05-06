// Core API
export { api } from "./api";

// Auth
export { authService, type LoginCredentials, type RegisterData, type AuthResponse } from "./auth.service";

// Infrastructure (SUPER_ADMIN)
export { buildingService } from "./building.service";
export { floorService } from "./floor.service";
export { roomService } from "./room.service";
export { departmentService, type CreateDepartmentData } from "./department.service";

// Academic Structure
export { batchService } from "./batch.service";
export { sectionService } from "./section.service";
export { subjectService, type AssignTeachersData } from "./subject.service";

// Users
export { teacherService, type CreateTeacherData } from "./teacher.service";
export { studentService, type CreateStudentData } from "./student.service";

// Core Systems
export {
  routineService,
  type GenerateSectionRoutineData,
  type SectionRoutineResponse,
  type GetRoutineFilters,
} from "./routine.service";
export { attendanceService, type CreateSessionData, type MarkAttendanceData } from "./attendance.service";
export { availabilityService, type AvailabilityData } from "./availability.service";
export { dashboardService } from "./dashboard.service";
export { exportService } from "./export.service";

// Types
export type { Role, User, Building, Floor, Room, Department, Batch, Section, Subject, Teacher, Student, RoutineEntry, AttendanceSession, AttendanceRecord } from "@/types";
