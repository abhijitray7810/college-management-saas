export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export const MOCK_USERS: (User & { password: string })[] = [
  { id: "u1", name: "Dr. Sarah Chen", email: "admin@college.edu", password: "admin123", role: "ADMIN" },
  { id: "u2", name: "Prof. James Wilson", email: "teacher@college.edu", password: "teacher123", role: "TEACHER" },
  { id: "u3", name: "Emma Rodriguez", email: "student@college.edu", password: "student123", role: "STUDENT" },
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIME_SLOTS = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
];

export interface RoutineCell {
  subject: string;
  teacher: string;
  room: string;
  locked?: boolean;
  routineId?: string;
}

export type Routine = Record<string, Record<string, RoutineCell | null>>;

const SUBJECTS = ["Data Structures", "Calculus II", "Physics Lab", "Database Systems", "Algorithms", "Machine Learning", "Operating Sys", "Discrete Math"];
const TEACHERS = ["Prof. Wilson", "Dr. Chen", "Prof. Patel", "Dr. Kumar", "Prof. Garcia"];
const ROOMS = ["A-101", "A-102", "B-201", "B-202", "Lab-1", "Lab-2"];

export function generateMockRoutine(): Routine {
  const r: Routine = {};
  DAYS.forEach((d) => {
    r[d] = {};
    TIME_SLOTS.forEach((t, i) => {
      if (Math.random() > 0.25) {
        r[d][t] = {
          subject: SUBJECTS[(i + d.length) % SUBJECTS.length],
          teacher: TEACHERS[(i + d.length) % TEACHERS.length],
          room: ROOMS[(i + d.length) % ROOMS.length],
          locked: Math.random() > 0.85,
        };
      } else {
        r[d][t] = null;
      }
    });
  });
  return r;
}

export const MOCK_STUDENTS = Array.from({ length: 28 }, (_, i) => ({
  id: `s${i + 1}`,
  rollNo: `CS-${String(i + 1).padStart(3, "0")}`,
  name: ["Aarav Shah","Maya Patel","Liam Brown","Sofia Lopez","Noah Kim","Olivia Davis","Ethan Wright","Ava Johnson","Lucas Müller","Mia Singh","Leo Tanaka","Zoe Nguyen","Kai Anderson","Iris Petrov","Ben Carter","Ella Romano","Finn O'Neill","Nora Ahmed","Owen Park","Ruby Silva","Jack Müller","Lily Chen","Max Weber","Chloe Dubois","Adam Cohen","Hana Kato","Theo Russo","Amelia Cruz"][i],
  attendance: Math.floor(60 + Math.random() * 40),
}));

export const MOCK_SUBJECTS = SUBJECTS.map((s, i) => ({
  code: `CS${300 + i * 10}`, name: s, attendance: Math.floor(65 + Math.random() * 35), totalClasses: 30 + i,
}));

export const ATTENDANCE_TREND = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`, attendance: Math.floor(70 + Math.random() * 25),
}));

export const TEACHERS_LIST = TEACHERS.map((t, i) => ({
  id: `t${i}`, name: t, dept: "Computer Science", load: Math.floor(8 + Math.random() * 12),
}));

export const ROOMS_LIST = ROOMS.map((r) => ({ id: r, name: r, capacity: 40 + Math.floor(Math.random() * 30) }));

export type RoutineStatus = "DRAFT" | "PENDING" | "APPROVED" | "ACTIVE";
