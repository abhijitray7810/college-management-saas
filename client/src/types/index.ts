// ============================================
// College Management SaaS - Type Definitions
// Aligned with Backend Institutional Hierarchy
// ============================================

// ============================================
// USER & AUTH
// ============================================
export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// ============================================
// INFRASTRUCTURE (SUPER_ADMIN)
// ============================================
export interface Building {
  id: string;
  name: string;
  code: string;
  address?: string;
  description?: string;
  isActive: boolean;
  floorCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  building?: Building;
  departmentId?: string;
  department?: Department;
  floorNumber: number;
  name?: string;
  description?: string;
  isActive: boolean;
  roomCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type RoomType = "CLASSROOM" | "LAB" | "SEMINAR_HALL" | "OFFICE";

export interface Room {
  id: string;
  floorId: string;
  floor?: Floor;
  code: string;
  name?: string;
  type: RoomType;
  capacity: number;
  features?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ACADEMIC STRUCTURE
// ============================================
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  hodId?: string;
  hod?: User;
  isActive: boolean;
  batchCount?: number;
  teacherCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  departmentId: string;
  department?: Department;
  name: string;
  year: number;
  academicYear: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  sectionCount?: number;
  studentCount?: number;
  subjects?: Subject[];
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  batchId: string;
  batch?: Batch;
  departmentId?: string;
  department?: Department;
  name: string;
  capacity: number;
  isActive: boolean;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USERS (Teachers & Students)
// ============================================
export interface Teacher {
  id: string;
  userId: string;
  user: User;
  departmentId?: string;
  department?: Department;
  employeeId: string;
  designation: string;
  specialization?: string;
  joiningDate?: string;
  isActive: boolean;
  subjects?: Subject[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  user: User;
  rollNumber: string;
  enrollmentNumber: string;
  batchId?: string;
  batch?: Batch;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSection {
  id: string;
  studentId: string;
  student: Student;
  sectionId: string;
  section: Section;
  batchId: string;
  batch: Batch;
  enrolledAt: string;
  isActive: boolean;
}

// ============================================
// SUBJECTS
// ============================================
export interface Subject {
  id: string;
  departmentId?: string;
  department?: Department;
  code: string;
  name: string;
  credits: number;
  type: "THEORY" | "LAB" | "PROJECT";
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchSubject {
  id: string;
  batchId: string;
  batch?: Batch;
  subjectId: string;
  subject: Subject;
  hoursPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  teacher: Teacher;
  subjectId: string;
  subject: Subject;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TIME SLOTS
// ============================================
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  slotNumber: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ROUTINE (Section-Based)
// ============================================
export type RoutineStatus = "DRAFT" | "PENDING" | "APPROVED" | "ACTIVE" | "ARCHIVED";

export interface RoutineEntry {
  id: string;
  departmentId: string;
  department?: Department;
  batchId: string;
  batch?: Batch;
  sectionId: string;
  section?: Section;
  subjectId: string;
  subject: Subject;
  teacherId: string;
  teacher: Teacher;
  roomId: string;
  room: Room;
  timeSlotId: string;
  timeSlot: TimeSlot;
  academicYear: string;
  isLocked: boolean;
  isManual: boolean;
  status: RoutineStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineCell {
  subject: string;
  subjectCode?: string;
  teacher: string;
  teacherId?: string;
  room: string;
  roomId?: string;
  roomType?: RoomType;
  routineId: string;
  locked: boolean;
  isManual?: boolean;
  status?: RoutineStatus;
  batchName?: string;
  sectionName?: string;
}

export type Routine = Record<DayOfWeek, Record<string, RoutineCell | null>>;

// ============================================
// ROUTINE GENERATION
// ============================================
export interface GenerateRoutineRequest {
  sectionId: string;
  academicYear?: string;
  preferSpreadAcrossDays?: boolean;
  prioritizeLabs?: boolean;
  maxIterations?: number;
  saveToDatabase?: boolean;
}

export interface GenerateRoutineResponse {
  success: boolean;
  message: string;
  sectionId?: string;
  data?: {
    totalSessions: number;
    assignedSessions: number;
    iterations: number;
    assignments: RoutineEntry[];
    savedRoutines?: number;
  };
}

// ============================================
// ATTENDANCE
// ============================================
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SessionStatus = "OPEN" | "CLOSED";

export interface AttendanceSession {
  id: string;
  routineId?: string;
  routine?: RoutineEntry;
  sectionId?: string;
  section?: Section;
  teacherId: string;
  teacher?: Teacher;
  timeSlotId: string;
  timeSlot?: TimeSlot;
  date: string;
  topic?: string;
  notes?: string;
  status: SessionStatus;
  markedCount: number;
  totalCount: number;
  percentage: number;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  session?: AttendanceSession;
  studentId: string;
  student?: Student;
  status: AttendanceStatus;
  remarks?: string;
  markedAt: string;
  markedBy?: string;
  updatedAt?: string;
}

export interface CreateSessionRequest {
  routineId: string;
  date: string;
  topic?: string;
  notes?: string;
}

export interface MarkAttendanceRequest {
  sessionId: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }>;
}

// ============================================
// AVAILABILITY
// ============================================
export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "BOOKED";

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  teacher?: Teacher;
  timeSlotId: string;
  timeSlot: TimeSlot;
  status: AvailabilityStatus;
  date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAvailability {
  id: string;
  roomId: string;
  room?: Room;
  timeSlotId: string;
  timeSlot: TimeSlot;
  status: AvailabilityStatus;
  date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DASHBOARD
// ============================================
export interface AdminDashboardData {
  counts: {
    buildings: number;
    floors: number;
    rooms: number;
    departments: number;
    batches: number;
    sections: number;
    students: number;
    teachers: number;
    subjects: number;
  };
  attendance: {
    overallPercentage: number;
    todaySessions: number;
  };
  alerts: {
    lowAttendanceStudents: number;
    overloadedTeachers: number;
    pendingApprovals: number;
  };
}

export interface TeacherDashboardData {
  summary: {
    teacherId: string;
    name: string;
    email: string;
    employeeId: string;
    designation: string;
    department?: string;
  };
  schedule: {
    today: Array<{
      routineId: string;
      subject: { name: string; code: string };
      room: { code: string; name?: string };
      timeSlot: { day: string; startTime: string; endTime: string };
      section?: { name: string; batch?: { name: string } };
    }>;
  };
  workload: {
    weeklySessions: number;
    totalSubjects: number;
    totalSections: number;
  };
  attendance: {
    sessionsMarked: number;
    averageAttendance: number;
  };
}

export interface StudentDashboardData {
  summary: {
    studentId: string;
    name: string;
    email: string;
    enrollmentNumber: string;
    rollNumber: string;
    batch?: string;
    section?: string;
    department?: string;
  };
  attendance: {
    overallPercentage: number;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
  };
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    percentage: number;
    isLowAttendance: boolean;
  }>;
  schedule: {
    today: Array<{
      routineId: string;
      subject: { name: string; code: string };
      teacher: { name: string };
      room: { code: string };
      timeSlot: { day: string; startTime: string; endTime: string };
    }>;
  };
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// FORM DATA TYPES
// ============================================
export interface CreateBuildingData {
  name: string;
  code: string;
  address?: string;
  description?: string;
}

export interface CreateFloorData {
  buildingId: string;
  floorNumber: number;
  name?: string;
  description?: string;
  departmentId?: string;
}

export interface CreateRoomData {
  floorId: string;
  code: string;
  name?: string;
  type: RoomType;
  capacity: number;
  features?: string[];
}

export interface CreateBatchData {
  departmentId: string;
  name: string;
  year: number;
  academicYear: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateSectionData {
  batchId: string;
  name: string;
  capacity: number;
}

export interface AssignStudentsData {
  sectionId: string;
  studentIds: string[];
}

export interface AssignSubjectsData {
  batchId: string;
  subjects: Array<{
    subjectId: string;
    hoursPerWeek: number;
  }>;
}

export interface AssignTeachersData {
  subjectId: string;
  teachers: Array<{
    teacherId: string;
    isPrimary?: boolean;
  }>;
}

export interface CreateSubjectData {
  departmentId?: string;
  code: string;
  name: string;
  credits: number;
  type: "THEORY" | "LAB" | "PROJECT";
  description?: string;
}
