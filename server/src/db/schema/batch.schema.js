import { pgTable, uuid, varchar, integer, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { departments } from './department.schema.js';

/**
 * Batches - Year-based academic batches within a department
 * Example: CSE 1st Year (2023), CSE 2nd Year (2022)
 * Year: 1, 2, 3, 4 representing academic year
 */
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(), // 1, 2, 3, 4
    academicYear: varchar('academic_year', { length: 20 }).notNull(), // e.g., "2023-2024"
    name: varchar('name', { length: 255 }).notNull(), // e.g., "CSE 1st Year (2023-24)"
    description: text('description'),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    departmentIdx: index('batches_department_id_idx').on(table.departmentId),
    yearIdx: index('batches_year_idx').on(table.year),
    uniqueDepartmentYear: unique('batches_dept_year_unique').on(table.departmentId, table.year, table.academicYear),
  })
);

export const batchesRelations = relations(batches, ({ one, many }) => ({
  department: one(departments, {
    fields: [batches.departmentId],
    references: [departments.id],
  }),
  sections: many('sections'),
  batchSubjects: many('batch_subjects'),
}));
