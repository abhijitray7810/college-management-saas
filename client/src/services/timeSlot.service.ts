import { api } from "./api";
import type { TimeSlot } from "@/types";
import type { ApiResponse } from "@/types";

export const timeSlotService = {
  // Get all time slots
  async getAll(): Promise<ApiResponse<TimeSlot[]>> {
    const response = await api.get("/time-slots");
    return response.data;
  },

  // Get time slots by day
  async getByDay(day: string): Promise<ApiResponse<TimeSlot[]>> {
    const response = await api.get(`/time-slots/day/${day}`);
    return response.data;
  },

  // Get time slot by ID
  async getById(id: string): Promise<ApiResponse<TimeSlot>> {
    const response = await api.get(`/time-slots/${id}`);
    return response.data;
  },
};
