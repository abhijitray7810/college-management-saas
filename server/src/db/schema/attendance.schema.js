import { pgTable, uuid, varchar, boolean, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { routines } from './routine.schema.js';
import { teachers } from './teacher.schema.js';
import { students } from './student.schema.js';
import { timeSlots } from './timeSlot.schema.js';
import { attendanceStatusEnum } from './enums.js';

export const attendanceSessions = pgTable(
  'attendance_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    timeSlotId: uuid('time_slot_id')
      .notNull()
      .references(() => timeSlots.id, { onDelete: 'cascade' }),
    sessionDate: timestamp('session_date', { withTimezone: true }).notNull(),
    topicCovered: varchar('topic_covered', { length: 255 }),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    cancellationReason: text('cancellation_reason'),
    markedBy: uuid('marked_by').references(() => teachers.id, { onDelete: 'set null' }),
    markedAt: timestamp('marked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    routineIdx: index('attendance_sessions_routine_id_idx').on(table.routineId),
    teacherIdx: index('attendance_sessions_teacher_id_idx').on(table.teacherId),
    slotIdx: index('attendance_sessions_slot_id_idx').on(table.timeSlotId),
    dateIdx: index('attendance_sessions_date_idx').on(table.sessionDate),
  })
);


export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  routine: one(routines, {
    fields: [attendanceSessions.routineId],
    references: [routines.id],
  }),
  teacher: one(teachers, {
    fields: [attendanceSessions.teacherId],
    references: [teachers.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [attendanceSessions.timeSlotId],
    references: [timeSlots.id],
  }),
  markedByTeacher: one(teachers, {
    fields: [attendanceSessions.markedBy],
    references: [teachers.id],
  }),
  attendanceRecords: many('attendance_records'),
}));

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull().default('ABSENT'),
    remarks: text('remarks'),
    markedAt: timestamp('marked_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionIdx: index('attendance_records_session_id_idx').on(table.sessionId),
    studentIdx: index('attendance_records_student_id_idx').on(table.studentId),
    uniqueSessionStudent: unique('attendance_records_session_student_unique').on(
      table.sessionId,
      table.studentId
    ),
  })
);

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
}));
