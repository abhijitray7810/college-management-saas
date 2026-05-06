import { api } from "./api";
import type { Teacher, Subject } from "@/types";
import type { ApiResponse } from "@/types";

export interface CreateTeacherData {
  userId?: string;
  name: string;
  email: string;
  password: string;
  departmentId?: string;
  employeeId: string;
  designation: string;
  specialization?: string;
  joiningDate?: string;
}

export const teacherService = {
  // Create teacher (ADMIN/SUPER_ADMIN)
  async create(data: CreateTeacherData): Promise<ApiResponse<Teacher>> {
    const response = await api.post("/teachers", data);
    return response.data;
  },

  // Get all teachers
  async getAll(): Promise<ApiResponse<Teacher[]>> {
    const response = await api.get("/teachers");
    return response.data;
  },

  // Get teachers by department
  async getByDepartment(departmentId: string): Promise<ApiResponse<Teacher[]>> {
    const response = await api.get(`/teachers/department/${departmentId}`);
    return response.data;
  },

  // Get teacher by ID
  async getById(id: string): Promise<ApiResponse<Teacher>> {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  // Get my teacher profile
  async getMyProfile(): Promise<ApiResponse<Teacher>> {
    const response = await api.get("/teachers/me");
    return response.data;
  },

  // Update teacher
  async update(id: string, data: Partial<CreateTeacherData>): Promise<ApiResponse<Teacher>> {
    const response = await api.patch(`/teachers/${id}`, data);
    return response.data;
  },

  // Delete teacher
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  // Get teacher subjects
  async getSubjects(teacherId: string): Promise<ApiResponse<Subject[]>> {
    const response = await api.get(`/teachers/${teacherId}/subjects`);
    return response.data;
  },
};
