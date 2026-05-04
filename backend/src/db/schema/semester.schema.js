import { pgTable, uuid, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { courses } from './course.schema.js';

export const semesters = pgTable(
  'semesters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    semesterNumber: integer('semester_number').notNull(),
    academicYear: varchar('academic_year', { length: 20 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    isActive: timestamp('is_active', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    courseIdx: index('semesters_course_id_idx').on(table.courseId),
    numberIdx: index('semesters_number_idx').on(table.semesterNumber),
    uniqueCourseSemester: unique('semesters_course_semester_unique').on(
      table.courseId,
      table.semesterNumber,
      table.academicYear
    ),
  })
);

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  course: one(courses, {
    fields: [semesters.courseId],
    references: [courses.id],
  }),
  subjects: many('subjects'),
  routines: many('routines'),
  students: many('students'),
}));
