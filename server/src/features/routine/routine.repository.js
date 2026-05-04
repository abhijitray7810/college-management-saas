import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  routines,
  semesters,
  subjects,
  teachers,
  rooms,
  timeSlots,
  teacherSubjects,
} from '../../db/schema/index.js';

export const routineRepository = {
  async getSemesterById(semesterId) {
    const result = await db.query.semesters.findFirst({
      where: eq(semesters.id, semesterId),
      with: {
        course: {
          with: {
            department: true,
          },
        },
      },
    });
    return result;
  },

  async getSubjectsBySemester(semesterId) {
    const results = await db.query.subjects.findMany({
      where: eq(subjects.semesterId, semesterId),
      orderBy: [subjects.isLab, subjects.hoursPerWeek],
    });
    return results;
  },

  async getTeachersBySubject(subjectId) {
    const results = await db.query.teacherSubjects.findMany({
      where: eq(teacherSubjects.subjectId, subjectId),
      with: {
        teacher: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return results.map((ts) => ts.teacher);
  },

  async getAllRooms(filters = {}) {
    let query = db.select().from(rooms).where(eq(rooms.isActive, true));
    
    if (filters.type) {
      query = query.where(eq(rooms.type, filters.type));
    }
    
    const results = await query;
    return results;
  },

  async getAllTimeSlots() {
    const results = await db.query.timeSlots.findMany({
      where: eq(timeSlots.isActive, true),
      orderBy: [timeSlots.day, timeSlots.slotNumber],
    });
    return results;
  },

  async getExistingRoutinesBySemester(semesterId) {
    const results = await db.query.routines.findMany({
      where: and(
        eq(routines.semesterId, semesterId),
        eq(routines.isActive, true)
      ),
      with: {
        subject: true,
        teacher: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        },
        room: true,
        timeSlot: true,
      },
    });
    return results;
  },

  async getExistingRoutinesByTimeSlot(timeSlotId) {
    const results = await db.query.routines.findMany({
      where: and(
        eq(routines.timeSlotId, timeSlotId),
        eq(routines.isActive, true)
      ),
      columns: {
        teacherId: true,
        roomId: true,
      },
    });
    return results;
  },

  async getTeacherRoutinesByTimeSlot(teacherId, timeSlotId) {
    const result = await db.query.routines.findFirst({
      where: and(
        eq(routines.teacherId, teacherId),
        eq(routines.timeSlotId, timeSlotId),
        eq(routines.isActive, true)
      ),
    });
    return result;
  },

  async getRoomRoutinesByTimeSlot(roomId, timeSlotId) {
    const result = await db.query.routines.findFirst({
      where: and(
        eq(routines.roomId, roomId),
        eq(routines.timeSlotId, timeSlotId),
        eq(routines.isActive, true)
      ),
    });
    return result;
  },

  async bulkCreateRoutines(routineData, academicYear) {
    const dataToInsert = routineData.map((item) => ({
      semesterId: item.semesterId,
      subjectId: item.subjectId,
      teacherId: item.teacherId,
      roomId: item.roomId,
      timeSlotId: item.timeSlotId,
      academicYear: academicYear,
      isRecurring: true,
      isActive: true,
    }));

    const results = await db.insert(routines).values(dataToInsert).returning();
    return results;
  },

  async deleteRoutinesBySemester(semesterId) {
    const result = await db
      .delete(routines)
      .where(eq(routines.semesterId, semesterId))
      .returning();
    return result;
  },

  async deactivateRoutinesBySemester(semesterId) {
    const result = await db
      .update(routines)
      .set({ isActive: false })
      .where(eq(routines.semesterId, semesterId))
      .returning();
    return result;
  },

  async getRoutineById(routineId) {
    const result = await db.query.routines.findFirst({
      where: eq(routines.id, routineId),
      with: {
        subject: true,
        teacher: {
          with: {
            user: {
              columns: { name: true },
            },
          },
        },
        room: true,
        timeSlot: true,
        semester: true,
      },
    });
    return result;
  },

  async updateRoutine(routineId, data) {
    const updateData = {
      ...(data.teacherId && { teacherId: data.teacherId }),
      ...(data.roomId && { roomId: data.roomId }),
      ...(data.timeSlotId && { timeSlotId: data.timeSlotId }),
      ...(data.notes && { notes: data.notes }),
      isManual: true,
      updatedBy: data.updatedBy,
      updatedAt: new Date(),
    };

    const [result] = await db
      .update(routines)
      .set(updateData)
      .where(eq(routines.id, routineId))
      .returning();
    return result;
  },

  async swapRoutines(routineId1, routineId2) {
    return await db.transaction(async (tx) => {
      // Get both routines
      const routine1 = await tx.query.routines.findFirst({
        where: eq(routines.id, routineId1),
      });
      const routine2 = await tx.query.routines.findFirst({
        where: eq(routines.id, routineId2),
      });

      if (!routine1 || !routine2) {
        throw new Error('One or both routines not found');
      }

      // Swap timeSlotId, roomId, teacherId
      await tx
        .update(routines)
        .set({
          timeSlotId: routine2.timeSlotId,
          roomId: routine2.roomId,
          teacherId: routine2.teacherId,
          isManual: true,
          updatedAt: new Date(),
        })
        .where(eq(routines.id, routineId1));

      await tx
        .update(routines)
        .set({
          timeSlotId: routine1.timeSlotId,
          roomId: routine1.roomId,
          teacherId: routine1.teacherId,
          isManual: true,
          updatedAt: new Date(),
        })
        .where(eq(routines.id, routineId2));

      return { routineId1, routineId2, swapped: true };
    });
  },

  async lockRoutine(routineId, isLocked, updatedBy) {
    const [result] = await db
      .update(routines)
      .set({
        isLocked,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(routines.id, routineId))
      .returning();
    return result;
  },

  async bulkLockRoutines(semesterId, isLocked, updatedBy) {
    const result = await db
      .update(routines)
      .set({
        isLocked,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(and(eq(routines.semesterId, semesterId), eq(routines.isActive, true)))
      .returning();
    return result;
  },

  async getRoutinesByStatus(status) {
    const results = await db.query.routines.findMany({
      where: eq(routines.status, status),
      with: {
        subject: true,
        teacher: {
          with: {
            user: {
              columns: { name: true },
            },
          },
        },
        room: true,
        timeSlot: true,
        semester: {
          with: {
            course: true,
          },
        },
      },
    });
    return results;
  },

  async updateRoutineStatus(semesterId, status, updatedBy) {
    const result = await db
      .update(routines)
      .set({
        status,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(and(eq(routines.semesterId, semesterId), eq(routines.isActive, true)))
      .returning();
    return result;
  },

  async getPendingRoutines() {
    return this.getRoutinesByStatus('PENDING');
  },
};
