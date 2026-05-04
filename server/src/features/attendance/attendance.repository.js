import { eq, and, inArray, sql, desc, count, gte, lte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  attendanceSessions,
  attendanceRecords,
  routines,
  students,
  subjects,
  teachers,
  users,
  timeSlots,
  rooms,
  semesters,
  courses,
} from '../../db/schema/index.js';

export const attendanceRepository = {
  async getRoutineById(routineId) {
    const result = await db.query.routines.findFirst({
      where: eq(routines.id, routineId),
      with: {
        subject: true,
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
        room: true,
        timeSlot: true,
        semester: {
          with: {
            course: {
              with: {
                department: true,
              },
            },
          },
        },
      },
    });
    return result;
  },

  async checkDuplicateSession(routineId, sessionDate) {
    const date = new Date(sessionDate);
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await db.query.attendanceSessions.findFirst({
      where: and(
        eq(attendanceSessions.routineId, routineId),
        gte(attendanceSessions.sessionDate, startOfDay),
        lte(attendanceSessions.sessionDate, endOfDay)
      ),
    });
    return result;
  },

  async createSession(data) {
    const [result] = await db
      .insert(attendanceSessions)
      .values({
        routineId: data.routineId,
        teacherId: data.teacherId,
        timeSlotId: data.timeSlotId,
        sessionDate: new Date(data.sessionDate),
        topicCovered: data.topicCovered,
        notes: data.notes,
      })
      .returning();
    return result;
  },

  async getSessionById(sessionId) {
    const result = await db.query.attendanceSessions.findFirst({
      where: eq(attendanceSessions.id, sessionId),
      with: {
        routine: {
          with: {
            subject: true,
            semester: {
              with: {
                course: true,
              },
            },
          },
        },
        teacher: {
          with: {
            user: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
        },
        timeSlot: true,
        records: {
          with: {
            student: {
              with: {
                user: {
                  columns: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return result;
  },

  async getSessionsByRoutine(routineId) {
    const results = await db.query.attendanceSessions.findMany({
      where: eq(attendanceSessions.routineId, routineId),
      with: {
        routine: {
          with: {
            subject: true,
          },
        },
        teacher: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        },
        records: {
          columns: {
            status: true,
          },
        },
      },
      orderBy: [desc(attendanceSessions.sessionDate)],
    });
    return results;
  },

  async bulkInsertAttendance(sessionId, records) {
    const dataToInsert = records.map((record) => ({
      sessionId,
      studentId: record.studentId,
      status: record.status,
      remarks: record.remarks || null,
    }));

    const results = await db
      .insert(attendanceRecords)
      .values(dataToInsert)
      .onConflictDoNothing()
      .returning();
    return results;
  },

  async updateAttendanceRecord(sessionId, studentId, data) {
    const [result] = await db
      .update(attendanceRecords)
      .set({
        status: data.status,
        remarks: data.remarks,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(attendanceRecords.sessionId, sessionId),
          eq(attendanceRecords.studentId, studentId)
        )
      )
      .returning();
    return result;
  },

  async getAttendanceRecord(sessionId, studentId) {
    const result = await db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.sessionId, sessionId),
        eq(attendanceRecords.studentId, studentId)
      ),
    });
    return result;
  },

  async getStudentsBySemester(semesterId) {
    const results = await db.query.students.findMany({
      where: eq(students.currentSemesterId, semesterId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [students.enrollmentNumber],
    });
    return results;
  },

  async getStudentAttendanceSummary(studentId, filters = {}) {
    let query = db
      .select({
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        totalSessions: count(attendanceSessions.id),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
        excusedCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'EXCUSED' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .innerJoin(
        attendanceSessions,
        eq(attendanceRecords.sessionId, attendanceSessions.id)
      )
      .innerJoin(routines, eq(attendanceSessions.routineId, routines.id))
      .innerJoin(subjects, eq(routines.subjectId, subjects.id))
      .where(eq(attendanceRecords.studentId, studentId));

    if (filters.semesterId) {
      query = query.where(eq(routines.semesterId, filters.semesterId));
    }

    if (filters.subjectId) {
      query = query.where(eq(subjects.id, filters.subjectId));
    }

    if (filters.startDate) {
      query = query.where(gte(attendanceSessions.sessionDate, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      query = query.where(lte(attendanceSessions.sessionDate, new Date(filters.endDate)));
    }

    const results = await query
      .groupBy(subjects.id, subjects.name, subjects.code)
      .orderBy(subjects.name);

    return results;
  },

  async getSubjectAttendanceSummary(subjectId, filters = {}) {
    let query = db
      .select({
        studentId: students.id,
        enrollmentNumber: students.enrollmentNumber,
        studentName: users.name,
        totalSessions: count(attendanceSessions.id),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
        excusedCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'EXCUSED' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .innerJoin(
        attendanceSessions,
        eq(attendanceRecords.sessionId, attendanceSessions.id)
      )
      .innerJoin(routines, eq(attendanceSessions.routineId, routines.id))
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(routines.subjectId, subjectId));

    if (filters.sessionId) {
      query = query.where(eq(attendanceRecords.sessionId, filters.sessionId));
    }

    const results = await query
      .groupBy(students.id, students.enrollmentNumber, users.name)
      .orderBy(users.name);

    return results;
  },

  async getSessionAttendanceStats(sessionId) {
    const stats = await db
      .select({
        totalStudents: count(),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
        excusedCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'EXCUSED' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId));

    return stats[0];
  },

  async deleteSession(sessionId) {
    const result = await db
      .delete(attendanceSessions)
      .where(eq(attendanceSessions.id, sessionId))
      .returning();
    return result[0];
  },

  async deleteAttendanceRecordsBySession(sessionId) {
    const result = await db
      .delete(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId))
      .returning();
    return result;
  },
};
