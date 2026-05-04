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
};
