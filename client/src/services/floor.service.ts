import { api } from "./api";
import type { Floor, CreateFloorData } from "@/types";
import type { ApiResponse } from "@/types";

export const floorService = {
  // Create floor
  async create(data: CreateFloorData): Promise<ApiResponse<Floor>> {
    const response = await api.post("/floors", data);
    return response.data;
  },

  // Get all floors
  async getAll(): Promise<ApiResponse<Floor[]>> {
    const response = await api.get("/floors");
    return response.data;
  },

  // Get floors by building
  async getByBuilding(buildingId: string): Promise<ApiResponse<Floor[]>> {
    const response = await api.get(`/floors/building/${buildingId}`);
    return response.data;
  },

  // Get floor by ID
  async getById(id: string): Promise<ApiResponse<Floor>> {
    const response = await api.get(`/floors/${id}`);
    return response.data;
  },

  // Update floor
  async update(id: string, data: Partial<CreateFloorData>): Promise<ApiResponse<Floor>> {
    const response = await api.patch(`/floors/${id}`, data);
    return response.data;
  },

  // Delete floor
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/floors/${id}`);
    return response.data;
  },

  // Assign floor to department
  async assignToDepartment(floorId: string, departmentId: string): Promise<ApiResponse<Floor>> {
    const response = await api.patch(`/floors/${floorId}/assign`, { departmentId });
    return response.data;
  },

  // Unassign floor from department
  async unassignFromDepartment(floorId: string): Promise<ApiResponse<Floor>> {
    const response = await api.patch(`/floors/${floorId}/unassign`);
    return response.data;
  },
};
