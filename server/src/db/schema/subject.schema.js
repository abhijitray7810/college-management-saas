import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { semesters } from './semester.schema.js';

export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
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
    semesterIdx: index('subjects_semester_id_idx').on(table.semesterId),
    codeIdx: index('subjects_code_idx').on(table.code),
    uniqueSemesterCode: unique('subjects_semester_code_unique').on(table.semesterId, table.code),
  })
);

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [subjects.semesterId],
    references: [semesters.id],
  }),
  teacherSubjects: many('teacher_subjects'),
  routines: many('routines'),
}));
