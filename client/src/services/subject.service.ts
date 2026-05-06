import { api } from "./api";
import type { Subject, CreateSubjectData, Teacher, TeacherSubject } from "@/types";
import type { ApiResponse } from "@/types";

export interface AssignTeachersData {
  teachers: Array<{
    teacherId: string;
    isPrimary?: boolean;
  }>;
}

export const subjectService = {
  // Create subject (ADMIN/SUPER_ADMIN)
  async create(data: CreateSubjectData): Promise<ApiResponse<Subject>> {
    const response = await api.post("/subjects", data);
    return response.data;
  },

  // Get all subjects
  async getAll(): Promise<ApiResponse<Subject[]>> {
    const response = await api.get("/subjects");
    return response.data;
  },

  // Get subjects by department
  async getByDepartment(departmentId: string): Promise<ApiResponse<Subject[]>> {
    const response = await api.get(`/subjects/department/${departmentId}`);
    return response.data;
  },

  // Get subject by ID
  async getById(id: string): Promise<ApiResponse<Subject>> {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  // Update subject
  async update(id: string, data: Partial<CreateSubjectData>): Promise<ApiResponse<Subject>> {
    const response = await api.patch(`/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  // Assign teachers to subject
  async assignTeachers(subjectId: string, data: AssignTeachersData): Promise<ApiResponse<Subject>> {
    const response = await api.post(`/subjects/${subjectId}/teachers`, data);
    return response.data;
  },

  // Remove teacher from subject
  async removeTeacher(subjectId: string, teacherId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/subjects/${subjectId}/teachers/${teacherId}`);
    return response.data;
  },

  // Get subject teachers
  async getTeachers(subjectId: string): Promise<ApiResponse<TeacherSubject[]>> {
    const response = await api.get(`/subjects/${subjectId}/teachers`);
    return response.data;
  },
};
