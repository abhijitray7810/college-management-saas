import { api } from "./api";
import type { Room, CreateRoomData } from "@/types";
import type { ApiResponse } from "@/types";

export const roomService = {
  // Create room
  async create(data: CreateRoomData): Promise<ApiResponse<Room>> {
    const response = await api.post("/rooms", data);
    return response.data;
  },

  // Get all rooms
  async getAll(): Promise<ApiResponse<Room[]>> {
    const response = await api.get("/rooms");
    return response.data;
  },

  // Get rooms by floor
  async getByFloor(floorId: string): Promise<ApiResponse<Room[]>> {
    const response = await api.get(`/rooms/floor/${floorId}`);
    return response.data;
  },

  // Get room by ID
  async getById(id: string): Promise<ApiResponse<Room>> {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Update room
  async update(id: string, data: Partial<CreateRoomData>): Promise<ApiResponse<Room>> {
    const response = await api.patch(`/rooms/${id}`, data);
    return response.data;
  },

  // Delete room
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },

  // Get available rooms for time slot
  async getAvailable(timeSlotId: string): Promise<ApiResponse<Room[]>> {
    const response = await api.get(`/rooms/available/${timeSlotId}`);
    return response.data;
  },
};
