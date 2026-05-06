import { pgTable, uuid, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { batches } from './batch.schema.js';
import { subjects } from './subject.schema.js';

/**
 * BatchSubjects - Junction table linking subjects to batches
 * Defines which subjects are taught in which batch/year
 * Includes hours per week for scheduling
 */
export const batchSubjects = pgTable(
  'batch_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    hoursPerWeek: integer('hours_per_week').notNull().default(3),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    batchIdx: index('batch_subjects_batch_id_idx').on(table.batchId),
    subjectIdx: index('batch_subjects_subject_id_idx').on(table.subjectId),
    uniqueBatchSubject: unique('batch_subjects_unique').on(table.batchId, table.subjectId),
  })
);

export const batchSubjectsRelations = relations(batchSubjects, ({ one, many }) => ({
  batch: one(batches, {
    fields: [batchSubjects.batchId],
    references: [batches.id],
  }),
  subject: one(subjects, {
    fields: [batchSubjects.subjectId],
    references: [subjects.id],
  }),
}));
