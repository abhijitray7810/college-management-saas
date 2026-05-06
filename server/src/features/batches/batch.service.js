import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { batches, departments, sections, subjects, batchSubjects } from '../../db/schema/index.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

/**
 * Batch Service - Managed by HOD (ADMIN) or SUPER_ADMIN
 * Handles academic batches (year-based) within departments
 */
export const batchService = {
  /**
   * Create a new batch
   * @param {Object} data - Batch data
   * @param {string} data.departmentId - Department ID
   * @param {number} data.year - Academic year (1, 2, 3, 4)
   * @param {string} data.academicYear - Academic year string (e.g., "2023-2024")
   * @param {string} [data.name] - Batch name
   */
  async create(data, userRole, userDepartmentId) {
    // Authorization check
    if (userRole !== 'SUPER_ADMIN' && userDepartmentId !== data.departmentId) {
      throw new AppError('You can only create batches in your own department', 403, 'FORBIDDEN');
    }

    // Verify department exists
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, data.departmentId),
    });

    if (!department) {
      throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
    }

    // Check for duplicate batch
    const existing = await db.query.batches.findFirst({
      where: and(
        eq(batches.departmentId, data.departmentId),
        eq(batches.year, data.year),
        eq(batches.academicYear, data.academicYear)
      ),
    });

    if (existing) {
      throw new AppError('Batch already exists for this department, year and academic year', 400, 'DUPLICATE_BATCH');
    }

    const batchName = data.name || `${department.code} ${data.year}${ordinalSuffix(data.year)} Year (${data.academicYear})`;

    const [batch] = await db.insert(batches).values({
      departmentId: data.departmentId,
      year: data.year,
      academicYear: data.academicYear,
      name: batchName,
      description: data.description,
      isActive: 'true',
    }).returning();

    return batch;
  },

  /**
   * Get all batches with optional filters
   */
  async getAll(filters = {}, userRole, userDepartmentId) {
    let whereClause = eq(batches.isActive, 'true');

    // Department filter for HOD
    if (userRole === 'ADMIN' && userDepartmentId) {
      whereClause = and(whereClause, eq(batches.departmentId, userDepartmentId));
    } else if (filters.departmentId) {
      whereClause = and(whereClause, eq(batches.departmentId, filters.departmentId));
    }

    if (filters.year) {
      whereClause = and(whereClause, eq(batches.year, filters.year));
    }

    if (filters.academicYear) {
      whereClause = and(whereClause, eq(batches.academicYear, filters.academicYear));
    }

    const allBatches = await db.query.batches.findMany({
      where: whereClause,
      orderBy: (batches, { desc, asc }) => [asc(batches.departmentId), desc(batches.year)],
      with: {
        department: true,
      },
    });

    // Get section and subject counts
    const batchesWithCounts = await Promise.all(
      allBatches.map(async (batch) => {
        const [sectionCount, subjectCount] = await Promise.all([
          db.select({ count: sql`count(*)::int` })
            .from(sections)
            .where(and(
              eq(sections.batchId, batch.id),
              eq(sections.isActive, 'true')
            )),
          db.select({ count: sql`count(*)::int` })
            .from(batchSubjects)
            .where(and(
              eq(batchSubjects.batchId, batch.id),
              eq(batchSubjects.isActive, 'true')
            )),
        ]);

        return {
          ...batch,
          sectionCount: sectionCount[0]?.count || 0,
          subjectCount: subjectCount[0]?.count || 0,
        };
      })
    );

    return batchesWithCounts;
  },

  /**
   * Get batch by ID with sections and subjects
   */
  async getById(id, userRole, userDepartmentId) {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
      with: {
        department: true,
        sections: {
          where: eq(sections.isActive, 'true'),
          orderBy: (sections, { asc }) => [asc(sections.name)],
        },
        batchSubjects: {
          where: eq(batchSubjects.isActive, 'true'),
          with: {
            subject: true,
          },
        },
      },
    });

    if (!batch) {
      throw new AppError('Batch not found', 404, 'BATCH_NOT_FOUND');
    }

    // Authorization check
    if (userRole === 'ADMIN' && userDepartmentId !== batch.departmentId) {
      throw new AppError('You can only view batches in your own department', 403, 'FORBIDDEN');
    }

    return batch;
  },

  /**
   * Assign subjects to batch
   */
  async assignSubjects(batchId, subjectIds, hoursPerWeek = 3, userRole, userDepartmentId) {
    const batch = await this.getById(batchId, userRole, userDepartmentId);

    const results = [];
    for (const subjectId of subjectIds) {
      // Check if already assigned
      const existing = await db.query.batchSubjects.findFirst({
        where: and(
          eq(batchSubjects.batchId, batchId),
          eq(batchSubjects.subjectId, subjectId)
        ),
      });

      if (!existing) {
        const [assignment] = await db.insert(batchSubjects).values({
          batchId,
          subjectId,
          hoursPerWeek,
          isActive: 'true',
        }).returning();
        results.push(assignment);
      }
    }

    return results;
  },

  /**
   * Remove subject from batch
   */
  async removeSubject(batchId, subjectId, userRole, userDepartmentId) {
    await this.getById(batchId, userRole, userDepartmentId); // Auth check

    await db.delete(batchSubjects)
      .where(and(
        eq(batchSubjects.batchId, batchId),
        eq(batchSubjects.subjectId, subjectId)
      ));

    return { success: true, message: 'Subject removed from batch' };
  },

  /**
   * Update batch
   */
  async update(id, data, userRole, userDepartmentId) {
    const batch = await this.getById(id, userRole, userDepartmentId);

    const [updated] = await db.update(batches)
      .set({
        name: data.name ?? batch.name,
        description: data.description ?? batch.description,
        isActive: data.isActive ?? batch.isActive,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, id))
      .returning();

    return updated;
  },

  /**
   * Delete batch (soft delete)
   */
  async delete(id, userRole, userDepartmentId) {
    const batch = await this.getById(id, userRole, userDepartmentId);

    // Check if batch has sections
    const sectionCount = await db.select({ count: sql`count(*)::int` })
      .from(sections)
      .where(eq(sections.batchId, id));

    if (sectionCount[0]?.count > 0) {
      throw new AppError('Cannot delete batch with sections. Remove sections first.', 400, 'BATCH_HAS_SECTIONS');
    }

    await db.update(batches)
      .set({ isActive: 'false', updatedAt: new Date() })
      .where(eq(batches.id, id));

    return { success: true, message: 'Batch deleted' };
  },
};

// Helper function for ordinal suffix
function ordinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
