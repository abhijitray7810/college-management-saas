import { eq, and, inArray, notInArray, isNull, or, gte, lte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  teacherAvailabilities,
  roomAvailabilities,
  teachers,
  rooms,
  timeSlots,
  routines,
} from '../../db/schema/index.js';

export const availabilityRepository = {
  async getTeacherAvailabilityBySlot(teacherId, timeSlotId) {
    const result = await db.query.teacherAvailabilities.findFirst({
      where: and(
        eq(teacherAvailabilities.teacherId, teacherId),
        eq(teacherAvailabilities.timeSlotId, timeSlotId)
      ),
      with: {
        timeSlot: true,
      },
    });
    return result;
  },

  async getRoomAvailabilityBySlot(roomId, timeSlotId) {
    const result = await db.query.roomAvailabilities.findFirst({
      where: and(
        eq(roomAvailabilities.roomId, roomId),
        eq(roomAvailabilities.timeSlotId, timeSlotId)
      ),
      with: {
        timeSlot: true,
      },
    });
    return result;
  },

  async checkTeacherRoutineConflict(teacherId, timeSlotId) {
    const result = await db.query.routines.findFirst({
      where: and(
        eq(routines.teacherId, teacherId),
        eq(routines.timeSlotId, timeSlotId),
        eq(routines.isActive, true)
      ),
      columns: {
        id: true,
        subjectId: true,
        roomId: true,
      },
    });
    return result;
  },

  async checkRoomRoutineConflict(roomId, timeSlotId) {
    const result = await db.query.routines.findFirst({
      where: and(
        eq(routines.roomId, roomId),
        eq(routines.timeSlotId, timeSlotId),
        eq(routines.isActive, true)
      ),
      columns: {
        id: true,
        subjectId: true,
        teacherId: true,
      },
    });
    return result;
  },

  async createTeacherAvailability(data) {
    const [result] = await db
      .insert(teacherAvailabilities)
      .values({
        teacherId: data.teacherId,
        timeSlotId: data.timeSlotId,
        status: data.status,
        notes: data.notes,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      })
      .returning();
    return result;
  },

  async createRoomAvailability(data) {
    const [result] = await db
      .insert(roomAvailabilities)
      .values({
        roomId: data.roomId,
        timeSlotId: data.timeSlotId,
        status: data.status,
        notes: data.notes,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      })
      .returning();
    return result;
  },

  async getTeacherAvailabilityList(teacherId) {
    const results = await db.query.teacherAvailabilities.findMany({
      where: eq(teacherAvailabilities.teacherId, teacherId),
      with: {
        timeSlot: true,
      },
      orderBy: [teacherAvailabilities.createdAt],
    });
    return results;
  },

  async getRoomAvailabilityList(roomId) {
    const results = await db.query.roomAvailabilities.findMany({
      where: eq(roomAvailabilities.roomId, roomId),
      with: {
        timeSlot: true,
      },
      orderBy: [roomAvailabilities.createdAt],
    });
    return results;
  },

  async deleteTeacherAvailability(id) {
    const result = await db
      .delete(teacherAvailabilities)
      .where(eq(teacherAvailabilities.id, id))
      .returning();
    return result[0];
  },

  async deleteRoomAvailability(id) {
    const result = await db
      .delete(roomAvailabilities)
      .where(eq(roomAvailabilities.id, id))
      .returning();
    return result[0];
  },

  async fetchAllTeachers() {
    const results = await db.query.teachers.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return results;
  },

  async fetchAllRooms(filters = {}) {
    let query = db.select().from(rooms);
    
    if (filters.type) {
      query = query.where(eq(rooms.type, filters.type));
    }
    
    if (filters.isActive !== undefined) {
      query = query.where(eq(rooms.isActive, filters.isActive));
    }
    
    const results = await query;
    return results;
  },

  async getBusyTeacherIds(timeSlotId) {
    const results = await db
      .select({ teacherId: teacherAvailabilities.teacherId })
      .from(teacherAvailabilities)
      .where(
        and(
          eq(teacherAvailabilities.timeSlotId, timeSlotId),
          eq(teacherAvailabilities.status, 'BUSY')
        )
      );
    return results.map((r) => r.teacherId);
  },

  async getBookedTeacherIds(timeSlotId) {
    const results = await db
      .select({ teacherId: routines.teacherId })
      .from(routines)
      .where(
        and(
          eq(routines.timeSlotId, timeSlotId),
          eq(routines.isActive, true)
        )
      );
    return results.map((r) => r.teacherId);
  },

  async getBusyRoomIds(timeSlotId) {
    const results = await db
      .select({ roomId: roomAvailabilities.roomId })
      .from(roomAvailabilities)
      .where(
        and(
          eq(roomAvailabilities.timeSlotId, timeSlotId),
          eq(roomAvailabilities.status, 'BUSY')
        )
      );
    return results.map((r) => r.roomId);
  },

  async getBookedRoomIds(timeSlotId) {
    const results = await db
      .select({ roomId: routines.roomId })
      .from(routines)
      .where(
        and(
          eq(routines.timeSlotId, timeSlotId),
          eq(routines.isActive, true)
        )
      );
    return results.map((r) => r.roomId);
  },

  async getTimeSlotById(timeSlotId) {
    const result = await db.query.timeSlots.findFirst({
      where: eq(timeSlots.id, timeSlotId),
    });
    return result;
  },
};
