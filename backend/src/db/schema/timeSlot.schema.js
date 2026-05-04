import { pgTable, uuid, time, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { dayEnum } from './enums.js';

export const timeSlots = pgTable(
  'time_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    day: dayEnum('day').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    slotNumber: integer('slot_number').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dayIdx: index('time_slots_day_idx').on(table.day),
    slotNumberIdx: index('time_slots_number_idx').on(table.slotNumber),
    uniqueDaySlot: unique('time_slots_day_slot_unique').on(table.day, table.slotNumber),
  })
);


export const timeSlotsRelations = relations(timeSlots, ({ many }) => ({
  teacherAvailabilities: many('teacher_availabilities'),
  roomAvailabilities: many('room_availabilities'),
  routines: many('routines'),
  attendanceSessions: many('attendance_sessions'),
}));
