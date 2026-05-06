import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema.js';

/**
 * Departments - Academic departments with HOD (Head of Department)
 * HOD is a user with ADMIN role assigned to manage the department
 */
export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    hodId: uuid('hod_id')
      .references(() => users.id, { onDelete: 'set null' }), // HOD assignment
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('departments_code_idx').on(table.code),
    nameIdx: index('departments_name_idx').on(table.name),
    hodIdx: index('departments_hod_id_idx').on(table.hodId),
  })
);

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  hod: one(users, {
    fields: [departments.hodId],
    references: [users.id],
  }),
  courses: many('courses'),
  batches: many('batches'),
  subjects: many('subjects'),
  teachers: many('teachers'),
  floors: many('floors'),
}));
