import { api } from "./api";
import type { Building, CreateBuildingData } from "@/types";
import type { ApiResponse, PaginatedResponse } from "@/types";

export const buildingService = {
  // Create building
  async create(data: CreateBuildingData): Promise<ApiResponse<Building>> {
    const response = await api.post("/buildings", data);
    return response.data;
  },

  // Get all buildings
  async getAll(): Promise<ApiResponse<Building[]>> {
    const response = await api.get("/buildings");
    return response.data;
  },

  // Get building by ID
  async getById(id: string): Promise<ApiResponse<Building>> {
    const response = await api.get(`/buildings/${id}`);
    return response.data;
  },

  // Update building
  async update(id: string, data: Partial<CreateBuildingData>): Promise<ApiResponse<Building>> {
    const response = await api.patch(`/buildings/${id}`, data);
    return response.data;
  },

  // Delete building
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
  },
};
