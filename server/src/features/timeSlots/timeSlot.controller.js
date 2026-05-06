import { timeSlotService } from './timeSlot.service.js';

export const timeSlotController = {
  async getAll(req, res, next) {
    try {
      const slots = await timeSlotService.getAll();
      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByDay(req, res, next) {
    try {
      const { day } = req.params;
      const slots = await timeSlotService.getByDay(day);
      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const slot = await timeSlotService.getById(id);
      res.status(200).json({
        success: true,
        data: slot,
      });
    } catch (error) {
      next(error);
    }
  },
};
