import { api } from "./api";
import type { Department } from "@/types";
import type { ApiResponse } from "@/types";

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  hodId?: string;
}

export const departmentService = {
  // Create department (SUPER_ADMIN only)
  async create(data: CreateDepartmentData): Promise<ApiResponse<Department>> {
    const response = await api.post("/departments", data);
    return response.data;
  },

  // Get all departments
  async getAll(): Promise<ApiResponse<Department[]>> {
    const response = await api.get("/departments");
    return response.data;
  },

  // Get department by ID
  async getById(id: string): Promise<ApiResponse<Department>> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Get my department (for HOD)
  async getMyDepartment(): Promise<ApiResponse<Department>> {
    const response = await api.get("/departments/my");
    return response.data;
  },

  // Update department
  async update(id: string, data: Partial<CreateDepartmentData>): Promise<ApiResponse<Department>> {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data;
  },

  // Assign HOD
  async assignHod(departmentId: string, hodId: string): Promise<ApiResponse<Department>> {
    const response = await api.patch(`/departments/${departmentId}/hod`, { hodId });
    return response.data;
  },

  // Delete department
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};
