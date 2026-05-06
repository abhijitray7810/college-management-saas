import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { teachers } from '../../db/schema/index.js';

export const teacherRepository = {
  async getAll() {
    return await db.query.teachers.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  },

  async getById(id) {
    return await db.query.teachers.findFirst({
      where: eq(teachers.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  },
};
