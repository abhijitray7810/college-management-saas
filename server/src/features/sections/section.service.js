import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { sections, batches, students, studentSections, departments, routines } from '../../db/schema/index.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

/**
 * Section Service - Managed by HOD (ADMIN) or SUPER_ADMIN
 * Handles sections (A, B, C) within batches and student assignments
 */
export const sectionService = {
  /**
   * Create a new section
   * @param {Object} data - Section data
   * @param {string} data.batchId - Batch ID
   * @param {string} data.name - Section name (A, B, C)
   * @param {number} [data.capacity] - Maximum capacity
   */
  async create(data, userRole, userDepartmentId) {
    // Verify batch exists and get department
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, data.batchId),
      with: {
        department: true,
      },
    });

    if (!batch) {
      throw new AppError('Batch not found', 404, 'BATCH_NOT_FOUND');
    }

    // Authorization check
    if (userRole !== 'SUPER_ADMIN' && userDepartmentId !== batch.departmentId) {
      throw new AppError('You can only create sections in your own department', 403, 'FORBIDDEN');
    }

    // Check for duplicate section name in batch
    const existing = await db.query.sections.findFirst({
      where: and(
        eq(sections.batchId, data.batchId),
        eq(sections.name, data.name)
      ),
    });

    if (existing) {
      throw new AppError('Section with this name already exists in this batch', 400, 'DUPLICATE_SECTION');
    }

    const [section] = await db.insert(sections).values({
      batchId: data.batchId,
      name: data.name.toUpperCase(),
      capacity: data.capacity || 60,
      isActive: 'true',
    }).returning();

    return {
      ...section,
      batch,
    };
  },

  /**
   * Get all sections with optional filters
   */
  async getAll(filters = {}, userRole, userDepartmentId) {
    let whereClause = eq(sections.isActive, 'true');

    if (filters.batchId) {
      whereClause = and(whereClause, eq(sections.batchId, filters.batchId));
    }

    // Department filter for HOD
    if (userRole === 'ADMIN') {
      // Get all batches in user's department
      const deptBatches = await db.query.batches.findMany({
        where: eq(batches.departmentId, userDepartmentId),
        columns: { id: true },
      });
      const batchIds = deptBatches.map(b => b.id);
      
      if (batchIds.length > 0) {
        whereClause = and(
          whereClause,
          sql`${sections.batchId} IN (${sql.join(batchIds, sql`, `)})`
        );
      } else {
        return []; // No batches in department
      }
    }

    const allSections = await db.query.sections.findMany({
      where: whereClause,
      orderBy: (sections, { asc }) => [asc(sections.batchId), asc(sections.name)],
      with: {
        batch: {
          with: {
            department: true,
          },
        },
      },
    });

    // Get student counts
    const sectionsWithCounts = await Promise.all(
      allSections.map(async (section) => {
        const studentCount = await db.select({ count: sql`count(*)::int` })
          .from(studentSections)
          .where(and(
            eq(studentSections.sectionId, section.id),
            eq(studentSections.isActive, 'true')
          ));

        return {
          ...section,
          studentCount: studentCount[0]?.count || 0,
        };
      })
    );

    return sectionsWithCounts;
  },

  /**
   * Get section by ID with students
   */
  async getById(id, userRole, userDepartmentId) {
    const section = await db.query.sections.findFirst({
      where: eq(sections.id, id),
      with: {
        batch: {
          with: {
            department: true,
          },
        },
        studentSections: {
          where: eq(studentSections.isActive, 'true'),
          with: {
            student: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new AppError('Section not found', 404, 'SECTION_NOT_FOUND');
    }

    // Authorization check
    if (userRole === 'ADMIN' && userDepartmentId !== section.batch.departmentId) {
      throw new AppError('You can only view sections in your own department', 403, 'FORBIDDEN');
    }

    return section;
  },

  /**
   * Assign students to section
   */
  async assignStudents(sectionId, studentIds, userRole, userDepartmentId) {
    const section = await this.getById(sectionId, userRole, userDepartmentId);

    // Check capacity
    const currentCount = section.studentSections?.length || 0;
    if (currentCount + studentIds.length > section.capacity) {
      throw new AppError('Cannot exceed section capacity', 400, 'CAPACITY_EXCEEDED');
    }

    const results = [];
    for (const studentId of studentIds) {
      // Check if student exists
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student) {
        continue; // Skip invalid students
      }

      // Check if already assigned to this section
      const existing = await db.query.studentSections.findFirst({
        where: and(
          eq(studentSections.studentId, studentId),
          eq(studentSections.sectionId, sectionId)
        ),
      });

      if (!existing) {
        // Remove from other sections in same batch
        await db.update(studentSections)
          .set({ isActive: 'false', updatedAt: new Date() })
          .where(and(
            eq(studentSections.studentId, studentId),
            eq(studentSections.batchId, section.batchId),
            eq(studentSections.isActive, 'true')
          ));

        // Assign to new section
        const [assignment] = await db.insert(studentSections).values({
          studentId,
          sectionId,
          batchId: section.batchId,
          isActive: 'true',
        }).returning();
        results.push(assignment);
      }
    }

    return results;
  },

  /**
   * Remove student from section
   */
  async removeStudent(sectionId, studentId, userRole, userDepartmentId) {
    await this.getById(sectionId, userRole, userDepartmentId); // Auth check

    await db.update(studentSections)
      .set({ isActive: 'false', updatedAt: new Date() })
      .where(and(
        eq(studentSections.sectionId, sectionId),
        eq(studentSections.studentId, studentId)
      ));

    return { success: true, message: 'Student removed from section' };
  },

  /**
   * Update section
   */
  async update(id, data, userRole, userDepartmentId) {
    const section = await this.getById(id, userRole, userDepartmentId);

    // Check new capacity
    if (data.capacity && data.capacity < section.studentSections?.length) {
      throw new AppError('New capacity cannot be less than current student count', 400, 'INVALID_CAPACITY');
    }

    const [updated] = await db.update(sections)
      .set({
        name: data.name ? data.name.toUpperCase() : section.name,
        capacity: data.capacity ?? section.capacity,
        isActive: data.isActive ?? section.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sections.id, id))
      .returning();

    return updated;
  },

  /**
   * Delete section (soft delete)
   */
  async delete(id, userRole, userDepartmentId) {
    const section = await this.getById(id, userRole, userDepartmentId);

    // Check if section has students
    if (section.studentSections?.length > 0) {
      throw new AppError('Cannot delete section with students. Remove students first.', 400, 'SECTION_HAS_STUDENTS');
    }

    // Check if section has routines
    const routineCount = await db.select({ count: sql`count(*)::int` })
      .from(routines)
      .where(eq(routines.sectionId, id));

    if (routineCount[0]?.count > 0) {
      throw new AppError('Cannot delete section with routines. Remove routines first.', 400, 'SECTION_HAS_ROUTINES');
    }

    await db.update(sections)
      .set({ isActive: 'false', updatedAt: new Date() })
      .where(eq(sections.id, id));

    return { success: true, message: 'Section deleted' };
  },
};
