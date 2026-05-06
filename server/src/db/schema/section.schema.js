import { pgTable, uuid, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { batches } from './batch.schema.js';

/**
 * Sections - Class sections within a batch
 * Example: CSE 1st Year - Section A, Section B
 */
export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(), // A, B, C, etc.
    capacity: integer('capacity').notNull().default(60),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    batchIdx: index('sections_batch_id_idx').on(table.batchId),
    uniqueBatchSection: unique('sections_batch_name_unique').on(table.batchId, table.name),
  })
);

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  batch: one(batches, {
    fields: [sections.batchId],
    references: [batches.id],
  }),
  studentSections: many('student_sections'),
  routines: many('routines'),
}));
