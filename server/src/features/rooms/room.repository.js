import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { rooms } from '../../db/schema/index.js';

export const roomRepository = {
  async getAll() {
    return await db.query.rooms.findMany({
      where: eq(rooms.isActive, true),
      with: {
        floor: true,
      },
    });
  },

  async getById(id) {
    return await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
      with: {
        floor: true,
      },
    });
  },
};
