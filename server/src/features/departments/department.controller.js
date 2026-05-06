import { departmentService } from './department.service.js';

export const departmentController = {
  async getAll(req, res, next) {
    try {
      const result = await departmentService.getAll();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await departmentService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMyDepartment(req, res, next) {
    try {
      const result = await departmentService.getMyDepartment(req.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
