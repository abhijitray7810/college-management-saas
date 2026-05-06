import { create } from "zustand";
import { availabilityService, type AvailabilityData } from "@/services/availability.service";
import type { AvailabilityStatus } from "@/types";

interface AvailabilitySlot {
  id: string;
  timeSlotId: string;
  status: AvailabilityStatus;
  timeSlot: {
    day: string;
    startTime: string;
    endTime: string;
  };
}

interface AvailabilityState {
  teacherAvailability: Record<string, AvailabilitySlot[]>;
  roomAvailability: Record<string, AvailabilitySlot[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTeacherAvailability: (teacherId: string) => Promise<void>;
  fetchRoomAvailability: (roomId: string) => Promise<void>;
  setTeacherSlot: (teacherId: string, data: AvailabilityData) => Promise<void>;
  setRoomSlot: (roomId: string, data: AvailabilityData) => Promise<void>;
  toggleTeacherSlot: (teacherId: string, timeSlotId: string, currentStatus: string) => Promise<void>;
  toggleRoomSlot: (roomId: string, timeSlotId: string, currentStatus: string) => Promise<void>;
  clearError: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  teacherAvailability: {},
  roomAvailability: {},
  isLoading: false,
  error: null,

  fetchTeacherAvailability: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await availabilityService.getTeacherAvailability(teacherId);
      const slots = response.data.map(item => ({
        ...item,
        status: item.status as "AVAILABLE" | "BUSY" | "BOOKED"
      }));
      set((state) => ({
        teacherAvailability: { ...state.teacherAvailability, [teacherId]: slots },
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchRoomAvailability: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await availabilityService.getRoomAvailability(roomId);
      const slots = response.data.map(item => ({
        ...item,
        status: item.status as "AVAILABLE" | "BUSY" | "BOOKED"
      }));
      set((state) => ({
        roomAvailability: { ...state.roomAvailability, [roomId]: slots },
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  setTeacherSlot: async (teacherId: string, data: AvailabilityData) => {
    set({ isLoading: true, error: null });
    try {
      await availabilityService.createTeacherAvailability({ ...data, teacherId });
      await get().fetchTeacherAvailability(teacherId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  setRoomSlot: async (roomId: string, data: AvailabilityData) => {
    set({ isLoading: true, error: null });
    try {
      await availabilityService.createRoomAvailability({ ...data, roomId });
      await get().fetchRoomAvailability(roomId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  toggleTeacherSlot: async (teacherId: string, timeSlotId: string, currentStatus: string) => {
    const newStatus = currentStatus === "BUSY" ? "AVAILABLE" : "BUSY";
    await get().setTeacherSlot(teacherId, {
      timeSlotId,
      status: newStatus,
    });
  },

  toggleRoomSlot: async (roomId: string, timeSlotId: string, currentStatus: string) => {
    const newStatus = currentStatus === "BUSY" ? "AVAILABLE" : "BUSY";
    await get().setRoomSlot(roomId, {
      timeSlotId,
      status: newStatus,
    });
  },

  clearError: () => set({ error: null }),
}));
