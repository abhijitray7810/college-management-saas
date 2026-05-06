import { create } from "zustand";
import { routineService, type GenerateSectionRoutineData } from "@/services/routine.service";
import type { Routine, RoutineStatus, RoutineCell, RoutineEntry, DayOfWeek } from "@/types";

// Transform backend routine entries to frontend grid format
export const transformRoutineData = (entries: RoutineEntry[]): Routine => {
  const routine: Routine = {
    MONDAY: {},
    TUESDAY: {},
    WEDNESDAY: {},
    THURSDAY: {},
    FRIDAY: {},
    SATURDAY: {},
    SUNDAY: {},
  };

  entries.forEach((entry) => {
    const day = entry.timeSlot.day as DayOfWeek;
    const timeKey = `${entry.timeSlot.startTime}-${entry.timeSlot.endTime}`;
    routine[day][timeKey] = {
      subject: entry.subject.name,
      subjectCode: entry.subject.code,
      teacher: entry.teacher?.user?.name || "Unknown",
      teacherId: entry.teacherId,
      room: entry.room?.code || "Unknown",
      roomId: entry.roomId,
      roomType: entry.room?.type,
      routineId: entry.id,
      locked: entry.isLocked || false,
      isManual: entry.isManual || false,
      status: entry.status,
      batchName: entry.batch?.name,
      sectionName: entry.section?.name,
    };
  });

  return routine;
};

interface RoutineState {
  // Data
  routine: Routine | null;
  entries: RoutineEntry[];
  status: RoutineStatus;
  sectionId: string | null;
  batchId: string | null;
  departmentId: string | null;
  academicYear: string;
  
  // UI State
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generationProgress: {
    totalSessions: number;
    assignedSessions: number;
    iterations: number;
  } | null;
  
  // Actions - Section-based generation
  generateForSection: (data: GenerateSectionRoutineData) => Promise<void>;
  loadBySection: (sectionId: string) => Promise<void>;
  loadByBatch: (batchId: string) => Promise<void>;
  loadByDepartment: (departmentId: string) => Promise<void>;
  
  // Actions - Management
  clear: () => void;
  refresh: () => Promise<void>;
  updateCell: (day: DayOfWeek, slot: string, cell: RoutineCell | null) => void;
  toggleLock: (routineId: string) => Promise<void>;
  swap: (routineId1: string, routineId2: string) => Promise<void>;
  
  // Actions - Workflow
  submitForApproval: () => Promise<void>;
  approve: () => Promise<void>;
  reject: (reason?: string) => Promise<void>;
  activate: () => Promise<void>;
  resetToDraft: () => Promise<void>;
  setStatus: (s: RoutineStatus) => void;
  
  // Actions - Validation
  validate: () => Promise<{
    isValid: boolean;
    conflictCount: number;
    conflicts: Array<{
      type: "TEACHER" | "ROOM" | "SECTION";
      message: string;
    }>;
  }>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  // Initial state - NO MOCK DATA
  routine: null,
  entries: [],
  status: "DRAFT",
  sectionId: null,
  batchId: null,
  departmentId: null,
  academicYear: "2024-2025",
  isLoading: false,
  isGenerating: false,
  error: null,
  generationProgress: null,

  // Generate routine for a section
  generateForSection: async (data) => {
    set({ isGenerating: true, error: null, generationProgress: null });
    try {
      const response = await routineService.generateSection(data);
      
      if (response.success && response.data) {
        const routine = transformRoutineData(response.data.routines);
        set({
          routine,
          entries: response.data.routines,
          status: "DRAFT",
          sectionId: data.sectionId,
          isGenerating: false,
          generationProgress: {
            totalSessions: response.data.totalSessions,
            assignedSessions: response.data.assignedSessions,
            iterations: response.data.iterations,
          },
        });
      } else {
        throw new Error(response.message || "Failed to generate routine");
      }
    } catch (error: any) {
      set({
        isGenerating: false,
        error: error.response?.data?.error?.message || error.message || "Generation failed",
      });
      throw error;
    }
  },

  // Load routine by section
  loadBySection: async (sectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await routineService.getBySection(sectionId);
      const entries = response.data?.routines || [];
      const routine = transformRoutineData(entries);
      
      // Extract IDs from first entry if available
      const firstEntry = entries[0];
      
      set({
        routine,
        entries,
        sectionId,
        batchId: firstEntry?.batchId || null,
        departmentId: firstEntry?.departmentId || null,
        status: firstEntry?.status || "DRAFT",
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || error.message,
      });
      throw error;
    }
  },

  // Load routine by batch
  loadByBatch: async (batchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await routineService.getByBatch(batchId);
      const entries = response.data?.routines || [];
      const routine = transformRoutineData(entries);
      
      const firstEntry = entries[0];
      
      set({
        routine,
        entries,
        batchId,
        departmentId: firstEntry?.departmentId || null,
        status: firstEntry?.status || "DRAFT",
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || error.message,
      });
      throw error;
    }
  },

  // Load routine by department
  loadByDepartment: async (departmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await routineService.getByDepartment(departmentId);
      const entries = response.data?.routines || [];
      const routine = transformRoutineData(entries);
      
      set({
        routine,
        entries,
        departmentId,
        status: entries[0]?.status || "DRAFT",
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || error.message,
      });
      throw error;
    }
  },

  // Clear routine data
  clear: () => set({
    routine: null,
    entries: [],
    status: "DRAFT",
    sectionId: null,
    batchId: null,
    departmentId: null,
    error: null,
    generationProgress: null,
  }),

  // Refresh current routine
  refresh: async () => {
    const { sectionId, batchId, departmentId } = get();
    if (sectionId) {
      await get().loadBySection(sectionId);
    } else if (batchId) {
      await get().loadByBatch(batchId);
    } else if (departmentId) {
      await get().loadByDepartment(departmentId);
    }
  },

  // Update cell locally (for manual override UI)
  updateCell: (day, slot, cell) => {
    const r = get().routine;
    if (!r) return;
    set({ routine: { ...r, [day]: { ...r[day], [slot]: cell } } });
  },

  // Toggle lock status
  toggleLock: async (routineId: string) => {
    const entry = get().entries.find(e => e.id === routineId);
    if (!entry) return;
    
    try {
      await routineService.lock(routineId, !entry.isLocked);
      // Refresh to get updated data
      await get().refresh();
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Swap two routine entries
  swap: async (routineId1: string, routineId2: string) => {
    try {
      await routineService.swap(routineId1, routineId2);
      await get().refresh();
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Submit for approval
  submitForApproval: async () => {
    const { sectionId } = get();
    if (!sectionId) throw new Error("No section selected");
    
    try {
      await routineService.submitForApproval(sectionId);
      set({ status: "PENDING" });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Approve routine
  approve: async () => {
    const { sectionId } = get();
    if (!sectionId) throw new Error("No section selected");
    
    try {
      await routineService.approve(sectionId);
      set({ status: "APPROVED" });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Reject routine
  reject: async (reason?: string) => {
    const { sectionId } = get();
    if (!sectionId) throw new Error("No section selected");
    
    try {
      await routineService.reject(sectionId, reason);
      set({ status: "DRAFT" });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Activate routine
  activate: async () => {
    const { sectionId } = get();
    if (!sectionId) throw new Error("No section selected");
    
    try {
      await routineService.activate(sectionId);
      set({ status: "ACTIVE" });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Reset to draft
  resetToDraft: async () => {
    const { sectionId } = get();
    if (!sectionId) throw new Error("No section selected");
    
    try {
      await routineService.resetToDraft(sectionId);
      set({ status: "DRAFT" });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      throw error;
    }
  },

  // Set status locally
  setStatus: (s) => set({ status: s }),

  // Validate routine
  validate: async () => {
    const { sectionId } = get();
    if (!sectionId) {
      return { isValid: false, conflictCount: 0, conflicts: [] };
    }
    
    try {
      const response = await routineService.validate(sectionId);
      return response.data || { isValid: true, conflictCount: 0, conflicts: [] };
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || error.message });
      return { isValid: false, conflictCount: 0, conflicts: [] };
    }
  },
}));
