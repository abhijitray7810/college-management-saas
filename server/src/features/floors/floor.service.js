import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { floors, buildings, departments, rooms } from '../../db/schema/index.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

/**
 * Floor Service - Managed by SUPER_ADMIN
 * Handles floor management and department assignment
 */
export const floorService = {
  /**
   * Create a new floor
   * @param {Object} data - Floor data
   * @param {string} data.buildingId - Building ID
   * @param {number} data.floorNumber - Floor number (0=ground, 1=first, etc.)
   * @param {string} [data.name] - Floor name (e.g., "First Floor")
   * @param {string} [data.departmentId] - Department to assign this floor to
   */
  async create(data) {
    // Verify building exists
    const building = await db.query.buildings.findFirst({
      where: eq(buildings.id, data.buildingId),
    });

    if (!building) {
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }

    // Check for duplicate floor number in building
    const existing = await db.query.floors.findFirst({
      where: and(
        eq(floors.buildingId, data.buildingId),
        eq(floors.floorNumber, data.floorNumber)
      ),
    });

    if (existing) {
      throw new AppError('Floor number already exists in this building', 400, 'DUPLICATE_FLOOR');
    }

    // Verify department if provided
    if (data.departmentId) {
      const department = await db.query.departments.findFirst({
        where: eq(departments.id, data.departmentId),
      });
      if (!department) {
        throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
      }
    }

    const [floor] = await db.insert(floors).values({
      buildingId: data.buildingId,
      floorNumber: data.floorNumber,
      name: data.name || `${data.floorNumber === 0 ? 'Ground' : data.floorNumber + ordinalSuffix(data.floorNumber)} Floor`,
      departmentId: data.departmentId || null,
      description: data.description,
      isActive: 'true',
    }).returning();

    return floor;
  },

  /**
   * Get all floors with optional filters
   */
  async getAll(filters = {}) {
    let whereClause = eq(floors.isActive, 'true');

    if (filters.buildingId) {
      whereClause = and(whereClause, eq(floors.buildingId, filters.buildingId));
    }

    if (filters.departmentId) {
      whereClause = and(whereClause, eq(floors.departmentId, filters.departmentId));
    }

    const allFloors = await db.query.floors.findMany({
      where: whereClause,
      orderBy: (floors, { asc }) => [asc(floors.buildingId), asc(floors.floorNumber)],
      with: {
        building: true,
        department: true,
      },
    });

    // Get room counts for each floor
    const floorsWithCounts = await Promise.all(
      allFloors.map(async (floor) => {
        const roomCount = await db.select({ count: sql`count(*)::int` })
          .from(rooms)
          .where(and(
            eq(rooms.floorId, floor.id),
            eq(rooms.isActive, true)
          ));

        return {
          ...floor,
          roomCount: roomCount[0]?.count || 0,
        };
      })
    );

    return floorsWithCounts;
  },

  /**
   * Get floor by ID with rooms
   */
  async getById(id) {
    const floor = await db.query.floors.findFirst({
      where: eq(floors.id, id),
      with: {
        building: true,
        department: true,
        rooms: {
          where: eq(rooms.isActive, true),
        },
      },
    });

    if (!floor) {
      throw new AppError('Floor not found', 404, 'FLOOR_NOT_FOUND');
    }

    return floor;
  },

  /**
   * Assign floor to department
   */
  async assignToDepartment(id, departmentId) {
    const floor = await db.query.floors.findFirst({
      where: eq(floors.id, id),
    });

    if (!floor) {
      throw new AppError('Floor not found', 404, 'FLOOR_NOT_FOUND');
    }

    // Verify department exists
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
    });

    if (!department) {
      throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
    }

    const [updated] = await db.update(floors)
      .set({
        departmentId,
        updatedAt: new Date(),
      })
      .where(eq(floors.id, id))
      .returning();

    return updated;
  },

  /**
   * Update floor
   */
  async update(id, data) {
    const floor = await db.query.floors.findFirst({
      where: eq(floors.id, id),
    });

    if (!floor) {
      throw new AppError('Floor not found', 404, 'FLOOR_NOT_FOUND');
    }

    const [updated] = await db.update(floors)
      .set({
        name: data.name ?? floor.name,
        departmentId: data.departmentId ?? floor.departmentId,
        description: data.description ?? floor.description,
        isActive: data.isActive ?? floor.isActive,
        updatedAt: new Date(),
      })
      .where(eq(floors.id, id))
      .returning();

    return updated;
  },

  /**
   * Delete floor (soft delete)
   */
  async delete(id) {
    const floor = await db.query.floors.findFirst({
      where: eq(floors.id, id),
    });

    if (!floor) {
      throw new AppError('Floor not found', 404, 'FLOOR_NOT_FOUND');
    }

    // Check if floor has rooms
    const roomCount = await db.select({ count: sql`count(*)::int` })
      .from(rooms)
      .where(eq(rooms.floorId, id));

    if (roomCount[0]?.count > 0) {
      throw new AppError('Cannot delete floor with rooms. Remove rooms first.', 400, 'FLOOR_HAS_ROOMS');
    }

    await db.update(floors)
      .set({ isActive: 'false', updatedAt: new Date() })
      .where(eq(floors.id, id));

    return { success: true, message: 'Floor deleted' };
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
