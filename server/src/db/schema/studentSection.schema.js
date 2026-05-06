import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { students } from './student.schema.js';
import { sections } from './section.schema.js';
import { batches } from './batch.schema.js';

/**
 * StudentSections - Junction table linking students to sections and batches
 * A student belongs to one section within one batch
 * This supports: Student → Batch → Section hierarchy
 */
export const studentSections = pgTable(
  'student_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentIdx: index('student_sections_student_id_idx').on(table.studentId),
    sectionIdx: index('student_sections_section_id_idx').on(table.sectionId),
    batchIdx: index('student_sections_batch_id_idx').on(table.batchId),
    uniqueStudent: unique('student_sections_student_unique').on(table.studentId),
  })
);

export const studentSectionsRelations = relations(studentSections, ({ one }) => ({
  student: one(students, {
    fields: [studentSections.studentId],
    references: [students.id],
  }),
  section: one(sections, {
    fields: [studentSections.sectionId],
    references: [sections.id],
  }),
  batch: one(batches, {
    fields: [studentSections.batchId],
    references: [batches.id],
  }),
}));
