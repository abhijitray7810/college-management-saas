import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema.js';

export const teachers = pgTable(
  'teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
    designation: varchar('designation', { length: 100 }).notNull(),
    specialization: text('specialization'),
    qualification: text('qualification'),
    experienceYears: integer('experience_years'),
    joinDate: timestamp('join_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('teachers_user_id_idx').on(table.userId),
    employeeIdIdx: index('teachers_employee_id_idx').on(table.employeeId),
  })
);

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  teacherSubjects: many('teacher_subjects'),
  availabilities: many('teacher_availabilities'),
  routines: many('routines'),
  attendanceSessions: many('attendance_sessions'),
}));
