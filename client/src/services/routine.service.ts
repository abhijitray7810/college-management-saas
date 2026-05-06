import { api } from "./api";
import type { RoutineEntry, RoutineStatus, GenerateRoutineRequest, GenerateRoutineResponse } from "@/types";
import type { ApiResponse } from "@/types";

// Section-based routine generation request
export interface GenerateSectionRoutineData {
  sectionId: string;
  academicYear?: string;
  preferSpreadAcrossDays?: boolean;
  prioritizeLabs?: boolean;
  maxIterations?: number;
  saveToDatabase?: boolean;
}

// Section-based routine response
export interface SectionRoutineResponse {
  success: boolean;
  message: string;
  sectionId?: string;
  data?: {
    totalSessions: number;
    assignedSessions: number;
    iterations: number;
    routines: RoutineEntry[];
    savedRoutines?: number;
  };
}

// Get routine filters
export interface GetRoutineFilters {
  departmentId?: string;
  batchId?: string;
  sectionId?: string;
  academicYear?: string;
  status?: RoutineStatus;
}

export const routineService = {
  // NEW: Generate routine for a section
  async generateSection(data: GenerateSectionRoutineData): Promise<SectionRoutineResponse> {
    const response = await api.post("/routine/generate/section", data);
    return response.data;
  },

  // LEGACY: Generate routine (semester-based - deprecated)
  async generate(data: { semesterId: string; academicYear?: string }): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const response = await api.post("/routine/generate", data);
    return response.data;
  },

  // Get routine by section
  async getBySection(sectionId: string): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const response = await api.get(`/routine/section/${sectionId}`);
    return response.data;
  },

  // Get routine by filters
  async getByFilters(filters: GetRoutineFilters): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const params = new URLSearchParams();
    if (filters.departmentId) params.append("departmentId", filters.departmentId);
    if (filters.batchId) params.append("batchId", filters.batchId);
    if (filters.sectionId) params.append("sectionId", filters.sectionId);
    if (filters.academicYear) params.append("academicYear", filters.academicYear);
    if (filters.status) params.append("status", filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/routine${query}`);
    return response.data;
  },

  // Get routine by ID
  async getById(routineId: string): Promise<ApiResponse<RoutineEntry>> {
    const response = await api.get(`/routine/detail/${routineId}`);
    return response.data;
  },

  // Get routines by department
  async getByDepartment(departmentId: string): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const response = await api.get(`/routine/department/${departmentId}`);
    return response.data;
  },

  // Get routines by batch
  async getByBatch(batchId: string): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const response = await api.get(`/routine/batch/${batchId}`);
    return response.data;
  },

  // Get teacher's routine
  async getTeacherRoutine(teacherId: string, filters?: { academicYear?: string }): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const params = new URLSearchParams();
    if (filters?.academicYear) params.append("academicYear", filters.academicYear);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/routine/teacher/${teacherId}${query}`);
    return response.data;
  },

  // Get student's routine
  async getStudentRoutine(studentId: string): Promise<ApiResponse<{ routines: RoutineEntry[] }>> {
    const response = await api.get(`/routine/student/${studentId}`);
    return response.data;
  },

  // Delete routine by section
  async deleteBySection(sectionId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/routine/section/${sectionId}`);
    return response.data;
  },

  // Delete single routine entry
  async deleteEntry(routineId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/routine/entry/${routineId}`);
    return response.data;
  },

  // Validate routine constraints
  async validate(sectionId: string): Promise<ApiResponse<{
    isValid: boolean;
    conflictCount: number;
    conflicts: Array<{
      type: "TEACHER" | "ROOM" | "SECTION";
      teacherName?: string;
      roomCode?: string;
      sectionName?: string;
      timeSlot: string;
      message: string;
    }>;
  }>> {
    const response = await api.get(`/routine/section/${sectionId}/validate`);
    return response.data;
  },

  // Manual override - update routine entry
  async update(routineId: string, data: {
    teacherId?: string;
    roomId?: string;
    timeSlotId?: string;
    notes?: string;
  }): Promise<ApiResponse<RoutineEntry>> {
    const response = await api.patch(`/routine/update/${routineId}`, data);
    return response.data;
  },

  // Swap routine entries
  async swap(routineId1: string, routineId2: string): Promise<ApiResponse<void>> {
    const response = await api.post("/routine/swap", { routineId1, routineId2 });
    return response.data;
  },

  // Lock/Unlock routine entry
  async lock(routineId: string, isLocked: boolean): Promise<ApiResponse<RoutineEntry>> {
    const response = await api.patch(`/routine/lock/${routineId}`, { isLocked });
    return response.data;
  },

  // Bulk lock routines by section
  async bulkLock(sectionId: string, isLocked: boolean): Promise<ApiResponse<void>> {
    const response = await api.post("/routine/lock/bulk", { sectionId, isLocked });
    return response.data;
  },

  // Approval workflow - Submit for approval
  async submitForApproval(sectionId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/routine/submit/section/${sectionId}`);
    return response.data;
  },

  // Approve routine
  async approve(sectionId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/routine/approve/section/${sectionId}`);
    return response.data;
  },

  // Reject routine
  async reject(sectionId: string, reason?: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/routine/reject/section/${sectionId}`, { reason });
    return response.data;
  },

  // Activate routine
  async activate(sectionId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/routine/activate/section/${sectionId}`);
    return response.data;
  },

  // Reset to draft
  async resetToDraft(sectionId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/routine/reset/section/${sectionId}`);
    return response.data;
  },

  // Get pending approvals
  async getPending(): Promise<ApiResponse<{
    totalPending: number;
    routines: Array<{
      id: string;
      subject: { name: string; code: string };
      teacher: { user: { name: string } };
      room: { code: string };
      timeSlot: { day: string; startTime: string };
      section: { name: string; batch?: { name: string } };
      status: RoutineStatus;
    }>;
  }>> {
    const response = await api.get("/routine/pending");
    return response.data;
  },

  // Get generation preview
  async getPreview(sectionId: string): Promise<ApiResponse<{
    canGenerate: boolean;
    totalSessions: number;
    subjects: Array<{
      subject: { name: string; code: string };
      hoursPerWeek: number;
      sessionsNeeded: number;
    }>;
    teachers: Array<{
      id: string;
      user: { name: string };
    }>;
    rooms: Array<{
      id: string;
      code: string;
      type: string;
    }>;
    warnings: string[];
  }>> {
    const response = await api.get(`/routine/preview/${sectionId}`);
    return response.data;
  },
};
