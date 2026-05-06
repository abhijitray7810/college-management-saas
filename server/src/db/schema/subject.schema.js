import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { departments } from './department.schema.js';

/**
 * Subjects - Academic subjects belonging to a department
 * Subject-to-batch assignment handled via batch_subjects junction table
 */
export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    credits: integer('credits').notNull().default(3),
    isLab: boolean('is_lab').notNull().default(false),
    hoursPerWeek: integer('hours_per_week').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    departmentIdx: index('subjects_department_id_idx').on(table.departmentId),
    codeIdx: index('subjects_code_idx').on(table.code),
    uniqueDepartmentCode: unique('subjects_dept_code_unique').on(table.departmentId, table.code),
  })
);

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  batchSubjects: many('batch_subjects'),
  teacherSubjects: many('teacher_subjects'),
  routines: many('routines'),
}));
