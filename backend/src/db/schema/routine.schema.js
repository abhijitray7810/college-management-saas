import { pgTable, uuid, varchar, integer, boolean, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { semesters } from './semester.schema.js';
import { subjects } from './subject.schema.js';
import { teachers } from './teacher.schema.js';
import { rooms } from './room.schema.js';
import { timeSlots } from './timeSlot.schema.js';

export const routines = pgTable(
  'routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    timeSlotId: uuid('time_slot_id')
      .notNull()
      .references(() => timeSlots.id, { onDelete: 'cascade' }),
    academicYear: varchar('academic_year', { length: 20 }).notNull(),
    weekNumber: integer('week_number'),
    isRecurring: boolean('is_recurring').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveUntil: timestamp('effective_until', { withTimezone: true }),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    semesterIdx: index('routines_semester_id_idx').on(table.semesterId),
    subjectIdx: index('routines_subject_id_idx').on(table.subjectId),
    teacherIdx: index('routines_teacher_id_idx').on(table.teacherId),
    roomIdx: index('routines_room_id_idx').on(table.roomId),
    slotIdx: index('routines_slot_id_idx').on(table.timeSlotId),
    
    uniqueTeacherSlot: unique('routines_teacher_slot_unique').on(table.teacherId, table.timeSlotId),
    uniqueRoomSlot: unique('routines_room_slot_unique').on(table.roomId, table.timeSlotId),
  })
);


export const routinesRelations = relations(routines, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [routines.semesterId],
    references: [semesters.id],
  }),
  subject: one(subjects, {
    fields: [routines.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [routines.teacherId],
    references: [teachers.id],
  }),
  room: one(rooms, {
    fields: [routines.roomId],
    references: [rooms.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [routines.timeSlotId],
    references: [timeSlots.id],
  }),
  attendanceSessions: many('attendance_sessions'),
}));
