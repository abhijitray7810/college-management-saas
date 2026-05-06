import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { buildings, floors, rooms } from '../../db/schema/index.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

/**
 * Building Service - Managed by SUPER_ADMIN
 * Handles college infrastructure: buildings, floors, rooms
 */
export const buildingService = {
  /**
   * Create a new building
   * @param {Object} data - Building data
   * @param {string} data.name - Building name
   * @param {string} data.code - Unique building code
   * @param {string} [data.address] - Building address
   * @param {string} [data.description] - Description
   */
  async create(data) {
    // Check for duplicate code
    const existing = await db.query.buildings.findFirst({
      where: eq(buildings.code, data.code),
    });

    if (existing) {
      throw new AppError('Building with this code already exists', 400, 'DUPLICATE_CODE');
    }

    const [building] = await db.insert(buildings).values({
      name: data.name,
      code: data.code,
      address: data.address,
      description: data.description,
      isActive: 'true',
    }).returning();

    return building;
  },

  /**
   * Get all buildings with floor count
   */
  async getAll() {
    const allBuildings = await db.query.buildings.findMany({
      where: eq(buildings.isActive, 'true'),
      orderBy: (buildings, { asc }) => [asc(buildings.name)],
    });

    // Get floor counts for each building
    const buildingsWithCounts = await Promise.all(
      allBuildings.map(async (building) => {
        const floorCount = await db.select({ count: sql`count(*)::int` })
          .from(floors)
          .where(and(
            eq(floors.buildingId, building.id),
            eq(floors.isActive, 'true')
          ));

        return {
          ...building,
          floorCount: floorCount[0]?.count || 0,
        };
      })
    );

    return buildingsWithCounts;
  },

  /**
   * Get building by ID with all floors
   */
  async getById(id) {
    const building = await db.query.buildings.findFirst({
      where: eq(buildings.id, id),
      with: {
        floors: {
          where: eq(floors.isActive, 'true'),
          orderBy: (floors, { asc }) => [asc(floors.floorNumber)],
          with: {
            department: true,
            rooms: {
              where: eq(rooms.isActive, true),
            },
          },
        },
      },
    });

    if (!building) {
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }

    return building;
  },

  /**
   * Update building
   */
  async update(id, data) {
    const building = await db.query.buildings.findFirst({
      where: eq(buildings.id, id),
    });

    if (!building) {
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }

    // Check code uniqueness if changing
    if (data.code && data.code !== building.code) {
      const existing = await db.query.buildings.findFirst({
        where: eq(buildings.code, data.code),
      });
      if (existing) {
        throw new AppError('Building with this code already exists', 400, 'DUPLICATE_CODE');
      }
    }

    const [updated] = await db.update(buildings)
      .set({
        name: data.name ?? building.name,
        code: data.code ?? building.code,
        address: data.address ?? building.address,
        description: data.description ?? building.description,
        isActive: data.isActive ?? building.isActive,
        updatedAt: new Date(),
      })
      .where(eq(buildings.id, id))
      .returning();

    return updated;
  },

  /**
   * Delete building (soft delete)
   */
  async delete(id) {
    const building = await db.query.buildings.findFirst({
      where: eq(buildings.id, id),
    });

    if (!building) {
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }

    await db.update(buildings)
      .set({ isActive: 'false', updatedAt: new Date() })
      .where(eq(buildings.id, id));

    return { success: true, message: 'Building deleted' };
  },
};
