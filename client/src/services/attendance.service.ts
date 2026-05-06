import { api } from "./api";
import type { AttendanceSession, AttendanceRecord, CreateSessionRequest, MarkAttendanceRequest } from "@/types";
import type { ApiResponse } from "@/types";

// Re-export for backward compatibility
export type { AttendanceSession, AttendanceRecord };
export interface CreateSessionData {
  routineId: string;
  date: string;
  topic?: string;
  notes?: string;
}

export interface MarkAttendanceData {
  sessionId: string;
  records: Array<{
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    remarks?: string;
  }>;
}

export const attendanceService = {
  // Get all sessions with optional filters
  async getSessions(filters?: { 
    teacherId?: string; 
    semesterId?: string; 
    date?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: {
      sessions: AttendanceSession[];
    };
  }> {
    // Backend doesn't expose a list endpoint yet. Keep the signature for UI compatibility.
    // Consumers should use getSessionsByRoutine or student/subject endpoints.
    return {
      success: true,
      data: {
        sessions: [],
      },
    };
  },

  // Create attendance session
  async createSession(data: CreateSessionData): Promise<{
    success: boolean;
    data: AttendanceSession;
  }> {
    const response = await api.post("/attendance/session", data);
    return response.data;
  },

  // Close attendance session
  async closeSession(sessionId: string): Promise<{
    success: boolean;
    data: AttendanceSession;
  }> {
    const response = await api.patch(`/attendance/session/${sessionId}/close`);
    return response.data;
  },

  // Get sessions by routine
  async getSessionsByRoutine(routineId: string): Promise<{
    success: boolean;
    data: AttendanceSession[];
  }> {
    const response = await api.get(`/attendance/routine/${routineId}`);
    return response.data;
  },

  // Get session attendance details
  async getSessionAttendance(sessionId: string): Promise<{
    success: boolean;
    data: {
      session: AttendanceSession;
      attendance: AttendanceRecord[];
    };
  }> {
    const response = await api.get(`/attendance/session/${sessionId}`);
    return response.data;
  },

  // Mark attendance
  async markAttendance(data: MarkAttendanceData): Promise<{
    success: boolean;
    message: string;
    data: {
      markedCount: number;
    };
  }> {
    const response = await api.post("/attendance/mark", data);
    return response.data;
  },

  // Mark all present
  async markAllPresent(sessionId: string): Promise<void> {
    await api.post(`/attendance/mark-all-present/${sessionId}`);
  },

  // Update attendance record
  async updateAttendance(
    recordId: string,
    data: {
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      remarks?: string;
    }
  ): Promise<{
    success: boolean;
    data: AttendanceRecord;
  }> {
    const response = await api.patch(`/attendance/record/${recordId}`, data);
    return response.data;
  },

  // Get student attendance report
  async getStudentReport(
    studentId: string,
    filters?: { startDate?: string; endDate?: string; subjectId?: string }
  ): Promise<{
    success: boolean;
    data: {
      summary: {
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        overallPercentage: number;
      };
      subjectWise: Array<{
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        percentage: number;
      }>;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/attendance/student/${studentId}${query}`);
    return response.data;
  },

  // Get subject attendance report
  async getSubjectReport(
    subjectId: string,
    semesterId?: string
  ): Promise<{
    success: boolean;
    data: {
      summary: {
        totalStudents: number;
        totalSessions: number;
        averageAttendance: number;
      };
      studentWise: Array<{
        studentId: string;
        enrollmentNumber: string;
        studentName: string;
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        percentage: number;
      }>;
    };
  }> {
    const params = semesterId ? `?semesterId=${semesterId}` : "";
    const response = await api.get(`/attendance/subject/${subjectId}${params}`);
    return response.data;
  },

  // Get my attendance (for student)
  async getMyAttendance(): Promise<{
    success: boolean;
    data: {
      summary: {
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        overallPercentage: number;
      };
      subjectWise: Array<{
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        percentage: number;
      }>;
    };
  }> {
    const response = await api.get("/attendance/my-attendance");
    return response.data;
  },
};
