import { api } from "./api";
import type { Section, CreateSectionData, Student, StudentSection } from "@/types";
import type { ApiResponse } from "@/types";

export const sectionService = {
  // Create section (ADMIN/SUPER_ADMIN)
  async create(data: CreateSectionData): Promise<ApiResponse<Section>> {
    const response = await api.post("/sections", data);
    return response.data;
  },

  // Get all sections
  async getAll(): Promise<ApiResponse<Section[]>> {
    const response = await api.get("/sections");
    return response.data;
  },

  // Get sections by batch
  async getByBatch(batchId: string): Promise<ApiResponse<Section[]>> {
    const response = await api.get(`/sections/batch/${batchId}`);
    return response.data;
  },

  // Get sections by department
  async getByDepartment(departmentId: string): Promise<ApiResponse<Section[]>> {
    const response = await api.get(`/sections/department/${departmentId}`);
    return response.data;
  },

  // Get section by ID
  async getById(id: string): Promise<ApiResponse<Section>> {
    const response = await api.get(`/sections/${id}`);
    return response.data;
  },

  // Update section
  async update(id: string, data: Partial<CreateSectionData>): Promise<ApiResponse<Section>> {
    const response = await api.patch(`/sections/${id}`, data);
    return response.data;
  },

  // Delete section
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/sections/${id}`);
    return response.data;
  },

  // Assign students to section
  async assignStudents(sectionId: string, studentIds: string[]): Promise<ApiResponse<Section>> {
    const response = await api.post(`/sections/${sectionId}/students`, { studentIds });
    return response.data;
  },

  // Remove student from section
  async removeStudent(sectionId: string, studentId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/sections/${sectionId}/students/${studentId}`);
    return response.data;
  },

  // Get section students
  async getStudents(sectionId: string): Promise<ApiResponse<StudentSection[]>> {
    const response = await api.get(`/sections/${sectionId}/students`);
    return response.data;
  },
};
