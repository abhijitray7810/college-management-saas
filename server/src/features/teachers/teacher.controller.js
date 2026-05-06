import { teacherService } from './teacher.service.js';

export const teacherController = {
  async getAll(req, res, next) {
    try {
      const result = await teacherService.getAll();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await teacherService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
