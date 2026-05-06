import { timeSlotRepository } from './timeSlot.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const timeSlotService = {
  async getAll() {
    return await timeSlotRepository.getAll();
  },

  async getByDay(day) {
    return await timeSlotRepository.getByDay(day);
  },

  async getById(id) {
    const slot = await timeSlotRepository.getById(id);
    if (!slot) {
      throw new AppError('Time slot not found', 404);
    }
    return slot;
  },
};
