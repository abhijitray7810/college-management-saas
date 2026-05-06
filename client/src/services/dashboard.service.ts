import { api } from "./api";

export const dashboardService = {
  // Admin dashboard
  async getAdminDashboard(): Promise<{
    success: boolean;
    data: {
      counts: {
        students: number;
        teachers: number;
        subjects: number;
        rooms: number;
        activeSemesters: number;
      };
      attendance: {
        overallPercentage: number;
      };
      alerts: {
        lowAttendanceStudents: number;
        overloadedTeachers: number;
      };
    };
  }> {
    const response = await api.get("/dashboard/admin");
    return response.data;
  },

  // Teacher dashboard
  async getTeacherDashboard(teacherId?: string): Promise<{
    success: boolean;
    data: {
      summary: {
        teacherId: string;
        name: string;
        email: string;
        employeeId: string;
        designation: string;
      };
      schedule: {
        today: Array<{
          routineId: string;
          subject: { name: string; code: string };
          room: { code: string };
          timeSlot: { day: string; startTime: string; endTime: string };
        }>;
      };
      workload: {
        weeklySessions: number;
        totalSubjects: number;
      };
    };
  }> {
    const url = teacherId ? `/dashboard/teacher/${teacherId}` : "/dashboard/teacher";
    const response = await api.get(url);
    return response.data;
  },

  // Student dashboard
  async getStudentDashboard(studentId?: string): Promise<{
    success: boolean;
    data: {
      summary: {
        studentId: string;
        name: string;
        email: string;
        enrollmentNumber: string;
        course: string;
        semester: string;
      };
      attendance: {
        overallPercentage: number;
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
      };
      subjects: Array<{
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        totalSessions: number;
        presentCount: number;
        percentage: number;
        isLowAttendance: boolean;
      }>;
      schedule: {
        today: Array<{
          routineId: string;
          subject: { name: string; code: string };
          teacher: { name: string };
          room: { code: string };
          timeSlot: { day: string; startTime: string };
        }>;
      };
    };
  }> {
    const url = studentId ? `/dashboard/student/${studentId}` : "/dashboard/student";
    const response = await api.get(url);
    return response.data;
  },

  // Quick stats
  async getQuickStats(): Promise<{
    success: boolean;
    data: {
      counts: {
        students: number;
        teachers: number;
        subjects: number;
        rooms: number;
      };
      attendance: {
        overallPercentage: number;
      };
      alerts: {
        lowAttendanceStudents: number;
        overloadedTeachers: number;
      };
    };
  }> {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};
