import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Buildings - Top level infrastructure entity
 * Managed exclusively by SUPER_ADMIN
 */
export const buildings = pgTable(
  'buildings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    address: text('address'),
    description: text('description'),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('buildings_code_idx').on(table.code),
    nameIdx: index('buildings_name_idx').on(table.name),
  })
);

export const buildingsRelations = relations(buildings, ({ many }) => ({
  floors: many('floors'),
}));
