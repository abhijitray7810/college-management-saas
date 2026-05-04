import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';

export const authRepository = {
  async findByEmail(email) {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result;
  },

  async findById(id) {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return result;
  },

  async create(userData) {
    const [result] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });
    return result;
  },

  async emailExists(email) {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });
    return !!result;
  },
};
