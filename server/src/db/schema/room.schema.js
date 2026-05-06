import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roomTypeEnum } from './enums.js';
import { floors } from './floor.schema.js';

/**
 * Rooms - Belongs to a floor (which belongs to a building)
 * Supports CLASSROOM, LAB, SEMINAR_HALL, AUDITORIUM types
 */
export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    floorId: uuid('floor_id')
      .notNull()
      .references(() => floors.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    type: roomTypeEnum('type').notNull().default('CLASSROOM'),
    capacity: integer('capacity').notNull().default(30),
    hasProjector: boolean('has_projector').notNull().default(false),
    hasAc: boolean('has_ac').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    floorIdx: index('rooms_floor_id_idx').on(table.floorId),
    codeIdx: index('rooms_code_idx').on(table.code),
    typeIdx: index('rooms_type_idx').on(table.type),
  })
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  floor: one(floors, {
    fields: [rooms.floorId],
    references: [floors.id],
  }),
  availabilities: many('room_availabilities'),
  routines: many('routines'),
}));
