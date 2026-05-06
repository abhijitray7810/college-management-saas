import { pgTable, uuid, varchar, integer, boolean, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { departments } from './department.schema.js';
import { batches } from './batch.schema.js';
import { sections } from './section.schema.js';
import { subjects } from './subject.schema.js';
import { teachers } from './teacher.schema.js';
import { rooms } from './room.schema.js';
import { timeSlots } from './timeSlot.schema.js';
import { users } from './user.schema.js';
import { routineStatusEnum } from './enums.js';

/**
 * Routines - Class schedule entries
 * Links section → subject → teacher → room → time slot
 * Supports the new academic structure: Department → Batch → Section
 */
export const routines = pgTable(
  'routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Academic structure hierarchy
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    // Assignment
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
    // Scheduling
    academicYear: varchar('academic_year', { length: 20 }).notNull(),
    weekNumber: integer('week_number'),
    isRecurring: boolean('is_recurring').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveUntil: timestamp('effective_until', { withTimezone: true }),
    notes: text('notes'),
    // Status
    isActive: boolean('is_active').notNull().default(true),
    isLocked: boolean('is_locked').notNull().default(false),
    isManual: boolean('is_manual').notNull().default(false),
    status: routineStatusEnum('status').notNull().default('DRAFT'),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    departmentIdx: index('routines_department_id_idx').on(table.departmentId),
    batchIdx: index('routines_batch_id_idx').on(table.batchId),
    sectionIdx: index('routines_section_id_idx').on(table.sectionId),
    subjectIdx: index('routines_subject_id_idx').on(table.subjectId),
    teacherIdx: index('routines_teacher_id_idx').on(table.teacherId),
    roomIdx: index('routines_room_id_idx').on(table.roomId),
    slotIdx: index('routines_slot_id_idx').on(table.timeSlotId),
    lockedIdx: index('routines_is_locked_idx').on(table.isLocked),
    manualIdx: index('routines_is_manual_idx').on(table.isManual),
    statusIdx: index('routines_status_idx').on(table.status),
    
    // Constraints to prevent conflicts
    uniqueTeacherSlot: unique('routines_teacher_slot_unique').on(table.teacherId, table.timeSlotId),
    uniqueRoomSlot: unique('routines_room_slot_unique').on(table.roomId, table.timeSlotId),
    uniqueSectionSlot: unique('routines_section_slot_unique').on(table.sectionId, table.timeSlotId),
  })
);


export const routinesRelations = relations(routines, ({ one, many }) => ({
  department: one(departments, {
    fields: [routines.departmentId],
    references: [departments.id],
  }),
  batch: one(batches, {
    fields: [routines.batchId],
    references: [batches.id],
  }),
  section: one(sections, {
    fields: [routines.sectionId],
    references: [sections.id],
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
  updatedByUser: one(users, {
    fields: [routines.updatedBy],
    references: [users.id],
  }),
  attendanceSessions: many('attendance_sessions'),
}));
