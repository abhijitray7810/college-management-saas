import { pgTable, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { buildings } from './building.schema.js';
import { departments } from './department.schema.js';


export const floors = pgTable(
  'floors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buildingId: uuid('building_id')
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    floorNumber: integer('floor_number').notNull(),
    name: varchar('name', { length: 255 }), 
    departmentId: uuid('department_id')
      .references(() => departments.id, { onDelete: 'set null' }), 
    description: text('description'),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    buildingIdx: index('floors_building_id_idx').on(table.buildingId),
    departmentIdx: index('floors_department_id_idx').on(table.departmentId),
    uniqueBuildingFloor: index('floors_building_floor_unique').on(table.buildingId, table.floorNumber),
  })
);

export const floorsRelations = relations(floors, ({ one, many }) => ({
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
  department: one(departments, {
    fields: [floors.departmentId],
    references: [departments.id],
  }),
  rooms: many('rooms'),
}));
