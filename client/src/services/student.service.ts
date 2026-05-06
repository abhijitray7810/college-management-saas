import { api } from "./api";
import type { Student, Batch } from "@/types";
import type { ApiResponse } from "@/types";

export interface CreateStudentData {
  userId?: string;
  name: string;
  email: string;
  password: string;
  batchId?: string;
  rollNumber: string;
  enrollmentNumber: string;
}

export const studentService = {
  // Create student (ADMIN/SUPER_ADMIN)
  async create(data: CreateStudentData): Promise<ApiResponse<Student>> {
    const response = await api.post("/students", data);
    return response.data;
  },

  // Get all students
  async getAll(): Promise<ApiResponse<Student[]>> {
    const response = await api.get("/students");
    return response.data;
  },

  // Get students by batch
  async getByBatch(batchId: string): Promise<ApiResponse<Student[]>> {
    const response = await api.get(`/students/batch/${batchId}`);
    return response.data;
  },

  // Get students by section
  async getBySection(sectionId: string): Promise<ApiResponse<Student[]>> {
    const response = await api.get(`/students/section/${sectionId}`);
    return response.data;
  },

  // Get unassigned students (not in any section)
  async getUnassigned(): Promise<ApiResponse<Student[]>> {
    const response = await api.get("/students/unassigned");
    return response.data;
  },

  // Get student by ID
  async getById(id: string): Promise<ApiResponse<Student>> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Get my student profile
  async getMyProfile(): Promise<ApiResponse<Student>> {
    const response = await api.get("/students/me");
    return response.data;
  },

  // Update student
  async update(id: string, data: Partial<CreateStudentData>): Promise<ApiResponse<Student>> {
    const response = await api.patch(`/students/${id}`, data);
    return response.data;
  },

  // Delete student
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
