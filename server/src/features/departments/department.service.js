import { departmentRepository } from './department.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const departmentService = {
  async getAll() {
    const depts = await departmentRepository.getAll();
    return { success: true, data: depts };
  },

  async getById(id) {
    const dept = await departmentRepository.getById(id);
    if (!dept) throw new AppError('Department not found', 404);
    return { success: true, data: dept };
  },

  async getMyDepartment(user) {
    const dept = await departmentRepository.getByHodUserId(user.id);
    if (!dept) throw new AppError('Department not found for this user', 404);
    return { success: true, data: dept };
  },
};
