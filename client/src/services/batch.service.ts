import { api } from "./api";
import type { Batch, CreateBatchData, AssignSubjectsData, Subject } from "@/types";
import type { ApiResponse } from "@/types";

export const batchService = {
  // Create batch (ADMIN/SUPER_ADMIN)
  async create(data: CreateBatchData): Promise<ApiResponse<Batch>> {
    const response = await api.post("/batches", data);
    return response.data;
  },

  // Get all batches
  async getAll(): Promise<ApiResponse<Batch[]>> {
    const response = await api.get("/batches");
    return response.data;
  },

  // Get batches by department
  async getByDepartment(departmentId: string): Promise<ApiResponse<Batch[]>> {
    const response = await api.get(`/batches/department/${departmentId}`);
    return response.data;
  },

  // Get batch by ID
  async getById(id: string): Promise<ApiResponse<Batch>> {
    const response = await api.get(`/batches/${id}`);
    return response.data;
  },

  // Update batch
  async update(id: string, data: Partial<CreateBatchData>): Promise<ApiResponse<Batch>> {
    const response = await api.patch(`/batches/${id}`, data);
    return response.data;
  },

  // Delete batch
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/batches/${id}`);
    return response.data;
  },

  // Assign subjects to batch
  async assignSubjects(batchId: string, data: AssignSubjectsData): Promise<ApiResponse<Batch>> {
    const response = await api.post(`/batches/${batchId}/subjects`, data);
    return response.data;
  },

  // Remove subject from batch
  async removeSubject(batchId: string, subjectId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/batches/${batchId}/subjects/${subjectId}`);
    return response.data;
  },

  // Get batch subjects
  async getSubjects(batchId: string): Promise<ApiResponse<{ subject: Subject; hoursPerWeek: number }[]>> {
    const response = await api.get(`/batches/${batchId}/subjects`);
    return response.data;
  },
};
