import { teacherRepository } from './teacher.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const teacherService = {
  async getAll() {
    const teachers = await teacherRepository.getAll();
    return { success: true, data: teachers };
  },

  async getById(id) {
    const teacher = await teacherRepository.getById(id);
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }
    return { success: true, data: teacher };
  },
};
