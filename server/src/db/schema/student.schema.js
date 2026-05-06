import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema.js';
import { batches } from './batch.schema.js';

/**
 * Students - Student records linked to user accounts
 * Batch and section assignment is handled via student_sections junction table
 */
export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    rollNumber: varchar('roll_number', { length: 50 }).notNull().unique(),
    enrollmentNumber: varchar('enrollment_number', { length: 50 }).notNull().unique(),
    batchId: uuid('batch_id')
      .references(() => batches.id, { onDelete: 'set null' }), // Current batch
    admissionDate: timestamp('admission_date', { withTimezone: true }),
    guardianName: varchar('guardian_name', { length: 255 }),
    guardianContact: varchar('guardian_contact', { length: 20 }),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('students_user_id_idx').on(table.userId),
    rollNumberIdx: index('students_roll_number_idx').on(table.rollNumber),
    enrollmentIdx: index('students_enrollment_idx').on(table.enrollmentNumber),
    batchIdx: index('students_batch_id_idx').on(table.batchId),
  })
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [students.batchId],
    references: [batches.id],
  }),
  studentSections: many('student_sections'),
  attendanceRecords: many('attendance_records'),
}));
