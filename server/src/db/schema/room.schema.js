import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roomTypeEnum } from './enums.js';

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    type: roomTypeEnum('type').notNull().default('CLASSROOM'),
    capacity: integer('capacity').notNull().default(30),
    floor: integer('floor'),
    building: varchar('building', { length: 100 }),
    hasProjector: boolean('has_projector').notNull().default(false),
    hasAc: boolean('has_ac').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('rooms_code_idx').on(table.code),
    typeIdx: index('rooms_type_idx').on(table.type),
  })
);


export const roomsRelations = relations(rooms, ({ many }) => ({
  availabilities: many('room_availabilities'),
  routines: many('routines'),
}));
