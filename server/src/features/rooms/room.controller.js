import { roomService } from './room.service.js';

export const roomController = {
  async getAll(req, res, next) {
    try {
      const result = await roomService.getAll();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await roomService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
