import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { departments } from '../../db/schema/index.js';

export const departmentRepository = {
  async getAll() {
    return await db.query.departments.findMany({
      with: {
        hod: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async getById(id) {
    return await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        hod: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async getByHodUserId(userId) {
    return await db.query.departments.findFirst({
      where: eq(departments.hodId, userId),
      with: {
        hod: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },
};
