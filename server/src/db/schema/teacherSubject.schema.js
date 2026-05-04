import { pgTable, uuid, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teachers } from './teacher.schema.js';
import { subjects } from './subject.schema.js';

export const teacherSubjects = pgTable(
  'teacher_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').notNull().default(false),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    teacherIdx: index('teacher_subjects_teacher_id_idx').on(table.teacherId),
    subjectIdx: index('teacher_subjects_subject_id_idx').on(table.subjectId),
    uniqueTeacherSubject: unique('teacher_subjects_unique').on(table.teacherId, table.subjectId),
  })
);


export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherSubjects.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [teacherSubjects.subjectId],
    references: [subjects.id],
  }),
}));
