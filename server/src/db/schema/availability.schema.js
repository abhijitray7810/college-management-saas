import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teachers } from './teacher.schema.js';
import { rooms } from './room.schema.js';
import { timeSlots } from './timeSlot.schema.js';
import { availabilityStatusEnum } from './enums.js';

export const teacherAvailabilities = pgTable(
  'teacher_availabilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    timeSlotId: uuid('time_slot_id')
      .notNull()
      .references(() => timeSlots.id, { onDelete: 'cascade' }),
    status: availabilityStatusEnum('status').notNull().default('AVAILABLE'),
    notes: text('notes'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    teacherIdx: index('teacher_avail_teacher_id_idx').on(table.teacherId),
    slotIdx: index('teacher_avail_slot_id_idx').on(table.timeSlotId),
    uniqueTeacherSlot: unique('teacher_avail_unique').on(table.teacherId, table.timeSlotId),
  })
);


export const teacherAvailabilitiesRelations = relations(teacherAvailabilities, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherAvailabilities.teacherId],
    references: [teachers.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [teacherAvailabilities.timeSlotId],
    references: [timeSlots.id],
  }),
}));

export const roomAvailabilities = pgTable(
  'room_availabilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    timeSlotId: uuid('time_slot_id')
      .notNull()
      .references(() => timeSlots.id, { onDelete: 'cascade' }),
    status: availabilityStatusEnum('status').notNull().default('AVAILABLE'),
    notes: text('notes'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomIdx: index('room_avail_room_id_idx').on(table.roomId),
    slotIdx: index('room_avail_slot_id_idx').on(table.timeSlotId),
    uniqueRoomSlot: unique('room_avail_unique').on(table.roomId, table.timeSlotId),
  })
);

export const roomAvailabilitiesRelations = relations(roomAvailabilities, ({ one }) => ({
  room: one(rooms, {
    fields: [roomAvailabilities.roomId],
    references: [rooms.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [roomAvailabilities.timeSlotId],
    references: [timeSlots.id],
  }),
}));
