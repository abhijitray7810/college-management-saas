import { create } from "zustand";
import { attendanceService } from "@/services/attendance.service";
import type { AttendanceSession, AttendanceRecord, CreateSessionData } from "@/services/attendance.service";
import type { AttendanceStatus } from "@/types";

interface AttendanceState {
  sessions: AttendanceSession[];
  currentSession: AttendanceSession | null;
  records: AttendanceRecord[];
  studentReport: any | null;
  subjectReport: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (filters?: { teacherId?: string; sectionId?: string; date?: string; status?: string }) => Promise<void>;
  createSession: (data: CreateSessionData) => Promise<void>;
  closeSession: (sessionId: string) => Promise<void>;
  fetchSessionAttendance: (sessionId: string) => Promise<void>;
  markAttendance: (sessionId: string, records: { studentId: string; status: AttendanceStatus; remarks?: string }[]) => Promise<void>;
  updateAttendance: (recordId: string, data: { status: AttendanceStatus; remarks?: string }) => Promise<void>;
  fetchStudentReport: (studentId: string, filters?: { startDate?: string; endDate?: string; subjectId?: string }) => Promise<void>;
  fetchSubjectReport: (subjectId: string, sectionId?: string) => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessions: [],
  currentSession: null,
  records: [],
  studentReport: null,
  subjectReport: null,
  isLoading: false,
  error: null,

  fetchSessions: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getSessions(filters);
      set({ sessions: response.data.sessions, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  createSession: async (data: CreateSessionData) => {
    set({ isLoading: true, error: null });
    try {
      await attendanceService.createSession(data);
      await get().fetchSessions();
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  closeSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      await attendanceService.closeSession(sessionId);
      await get().fetchSessions();
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  fetchSessionAttendance: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getSessionAttendance(sessionId);
      set({ 
        currentSession: response.data.session, 
        records: response.data.attendance,
        isLoading: false 
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  markAttendance: async (sessionId, records) => {
    set({ isLoading: true, error: null });
    try {
      await attendanceService.markAttendance({ sessionId, records });
      await get().fetchSessionAttendance(sessionId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  updateAttendance: async (recordId, data) => {
    set({ isLoading: true, error: null });
    try {
      await attendanceService.updateAttendance(recordId, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  fetchStudentReport: async (studentId, filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getStudentReport(studentId, filters);
      set({ studentReport: response.data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchSubjectReport: async (subjectId, semesterId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getSubjectReport(subjectId, semesterId);
      set({ subjectReport: response.data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
