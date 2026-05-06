import { roomRepository } from './room.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const roomService = {
  async getAll() {
    const rooms = await roomRepository.getAll();
    return { success: true, data: rooms };
  },

  async getById(id) {
    const room = await roomRepository.getById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }
    return { success: true, data: room };
  },
};
