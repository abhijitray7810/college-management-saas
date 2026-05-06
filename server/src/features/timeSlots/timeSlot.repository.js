import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { timeSlots } from '../../db/schema/index.js';

export const timeSlotRepository = {
  async getAll() {
    return await db.query.timeSlots.findMany({
      where: eq(timeSlots.isActive, true),
      orderBy: [timeSlots.day, timeSlots.slotNumber],
    });
  },

  async getByDay(day) {
    return await db.query.timeSlots.findMany({
      where: and(eq(timeSlots.isActive, true), eq(timeSlots.day, day)),
      orderBy: [timeSlots.slotNumber],
    });
  },

  async getById(id) {
    return await db.query.timeSlots.findFirst({
      where: eq(timeSlots.id, id),
    });
  },
};
