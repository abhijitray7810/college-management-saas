import { api } from "./api";

export interface AvailabilityData {
  teacherId?: string;
  roomId?: string;
  timeSlotId: string;
  status: "AVAILABLE" | "BUSY" | "BOOKED";
  date?: string;
  notes?: string;
}

export const availabilityService = {
  // Create teacher availability
  async createTeacherAvailability(data: AvailabilityData): Promise<void> {
    await api.post("/availability/teacher", data);
  },

  // Create room availability
  async createRoomAvailability(data: AvailabilityData): Promise<void> {
    await api.post("/availability/room", data);
  },

  // Get available teachers for time slot
  async getAvailableTeachers(timeSlotId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      user: { name: string };
      employeeId: string;
      designation: string;
    }>;
  }> {
    const response = await api.get(`/availability/teachers/free/${timeSlotId}`);
    return response.data;
  },

  // Get available rooms for time slot
  async getAvailableRooms(timeSlotId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      code: string;
      name: string;
      capacity: number;
      type: string;
    }>;
  }> {
    const response = await api.get(`/availability/rooms/free/${timeSlotId}`);
    return response.data;
  },

  // Check conflicts
  async checkConflicts(data: {
    teacherId?: string;
    roomId?: string;
    timeSlotId: string;
  }): Promise<{
    success: boolean;
    data: {
      hasConflicts: boolean;
      conflicts: Array<{
        type: string;
        message: string;
        reason: string;
      }>;
    };
  }> {
    const response = await api.post("/availability/check/conflicts", data);
    return response.data;
  },

  // Get teacher availability
  async getTeacherAvailability(teacherId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      timeSlotId: string;
      status: string;
      timeSlot: {
        day: string;
        startTime: string;
        endTime: string;
      };
    }>;
  }> {
    const response = await api.get(`/availability/teacher/${teacherId}`);
    return response.data;
  },

  // Get room availability
  async getRoomAvailability(roomId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      timeSlotId: string;
      status: string;
      timeSlot: {
        day: string;
        startTime: string;
        endTime: string;
      };
    }>;
  }> {
    const response = await api.get(`/availability/room/${roomId}`);
    return response.data;
  },
};
