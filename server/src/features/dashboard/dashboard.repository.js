import { eq, and, sql, count, avg, gte, lte, desc, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  users,
  students,
  teachers,
  subjects,
  rooms,
  semesters,
  courses,
  departments,
  routines,
  timeSlots,
  attendanceSessions,
  attendanceRecords,
} from '../../db/schema/index.js';

export const dashboardRepository = {
  // ============== STUDENT QUERIES ==============

  async getStudentInfo(studentId) {
    const result = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
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

  async getStudentAttendanceSummary(studentId) {
    const results = await db
      .select({
        totalSessions: count(),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
        excusedCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'EXCUSED' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId));

    return results[0];
  },

  async getStudentSubjectWiseAttendance(studentId) {
    const results = await db
      .select({
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        totalSessions: count(),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .innerJoin(
        attendanceSessions,
        eq(attendanceRecords.sessionId, attendanceSessions.id)
      )
      .innerJoin(routines, eq(attendanceSessions.routineId, routines.id))
      .innerJoin(subjects, eq(routines.subjectId, subjects.id))
      .where(eq(attendanceRecords.studentId, studentId))
      .groupBy(subjects.id, subjects.name, subjects.code)
      .orderBy(subjects.name);

    return results;
  },

  async getStudentTodaySchedule(studentId, dayOfWeek) {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { currentSemesterId: true },
    });

    if (!student?.currentSemesterId) return [];

    const results = await db.query.routines.findMany({
      where: and(
        eq(routines.semesterId, student.currentSemesterId),
        eq(routines.isActive, true)
      ),
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
        timeSlot: {
          where: eq(timeSlots.day, dayOfWeek),
        },
      },
      orderBy: [asc(timeSlots.slotNumber)],
    });

    return results.filter((r) => r.timeSlot);
  },

  async getStudentUpcomingSchedule(studentId, currentDay, nextDays) {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { currentSemesterId: true },
    });

    if (!student?.currentSemesterId) return [];

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentIndex = days.indexOf(currentDay);
    const upcomingDays = [];

    for (let i = 1; i <= nextDays; i++) {
      const dayIndex = (currentIndex + i) % days.length;
      upcomingDays.push(days[dayIndex]);
    }

    const results = await db.query.routines.findMany({
      where: and(
        eq(routines.semesterId, student.currentSemesterId),
        eq(routines.isActive, true)
      ),
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
        timeSlot: {
          where: inArray(timeSlots.day, upcomingDays),
        },
      },
    });

    return results.filter((r) => r.timeSlot);
  },

  // ============== TEACHER QUERIES ==============

  async getTeacherInfo(teacherId) {
    const result = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId),
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
    return result;
  },

  async getTeacherTodayClasses(teacherId, dayOfWeek) {
    const results = await db.query.routines.findMany({
      where: and(
        eq(routines.teacherId, teacherId),
        eq(routines.isActive, true)
      ),
      with: {
        subject: true,
        semester: {
          with: {
            course: true,
          },
        },
        room: true,
        timeSlot: {
          where: eq(timeSlots.day, dayOfWeek),
        },
      },
      orderBy: [asc(timeSlots.slotNumber)],
    });

    return results.filter((r) => r.timeSlot);
  },

  async getTeacherWeeklyLoad(teacherId) {
    const results = await db
      .select({
        totalSessions: count(),
      })
      .from(routines)
      .where(and(eq(routines.teacherId, teacherId), eq(routines.isActive, true)));

    return results[0]?.totalSessions || 0;
  },

  async getTeacherSubjectDistribution(teacherId) {
    const results = await db
      .select({
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        sessionCount: count(),
      })
      .from(routines)
      .innerJoin(subjects, eq(routines.subjectId, subjects.id))
      .where(and(eq(routines.teacherId, teacherId), eq(routines.isActive, true)))
      .groupBy(subjects.id, subjects.name, subjects.code)
      .orderBy(desc(count()));

    return results;
  },

  async getTeacherPendingAttendance(teacherId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await db.query.attendanceSessions.findMany({
      where: and(
        eq(attendanceSessions.teacherId, teacherId),
        gte(attendanceSessions.sessionDate, today)
      ),
      with: {
        routine: {
          with: {
            subject: true,
            semester: true,
          },
        },
        records: {
          columns: { id: true },
        },
      },
    });

    // Filter sessions with no records (pending)
    return sessions.filter((s) => s.records.length === 0);
  },

  // ============== ADMIN QUERIES ==============

  async getAdminCounts() {
    const [studentCount, teacherCount, subjectCount, roomCount, semesterCount] =
      await Promise.all([
        db.select({ count: count() }).from(students),
        db.select({ count: count() }).from(teachers),
        db.select({ count: count() }).from(subjects),
        db.select({ count: count() }).from(rooms).where(eq(rooms.isActive, true)),
        db.select({ count: count() }).from(semesters).where(eq(semesters.isActive, true)),
      ]);

    return {
      students: studentCount[0]?.count || 0,
      teachers: teacherCount[0]?.count || 0,
      subjects: subjectCount[0]?.count || 0,
      rooms: roomCount[0]?.count || 0,
      activeSemesters: semesterCount[0]?.count || 0,
    };
  },

  async getOverallAttendanceStats() {
    const results = await db
      .select({
        totalRecords: count(),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        absentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'ABSENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
        excusedCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'EXCUSED' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords);

    return results[0];
  },

  async getLowAttendanceStudents(threshold = 75) {
    const results = await db
      .select({
        studentId: attendanceRecords.studentId,
        totalSessions: count(),
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        lateCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)`,
      })
      .from(attendanceRecords)
      .groupBy(attendanceRecords.studentId)
      .having(
        sql`(SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END) + 
            SUM(CASE WHEN ${attendanceRecords.status} = 'LATE' THEN 1 ELSE 0 END)) * 100.0 / count() < ${threshold}`
      );

    return results;
  },

  async getRoomUtilization() {
    const totalSlots = await db
      .select({ count: count() })
      .from(timeSlots)
      .where(eq(timeSlots.isActive, true));

    const bookedSlots = await db
      .select({
        roomId: routines.roomId,
        bookedSlots: count(),
      })
      .from(routines)
      .where(eq(routines.isActive, true))
      .groupBy(routines.roomId);

    const totalTimeSlots = totalSlots[0]?.count || 1;

    return bookedSlots.map((room) => ({
      roomId: room.roomId,
      bookedSlots: room.bookedSlots,
      utilizationPercentage: Math.round((room.bookedSlots / totalTimeSlots) * 100),
    }));
  },

  async getTeacherLoadDistribution() {
    const results = await db
      .select({
        teacherId: routines.teacherId,
        sessionCount: count(),
      })
      .from(routines)
      .where(eq(routines.isActive, true))
      .groupBy(routines.teacherId)
      .orderBy(desc(count()));

    const withInfo = await Promise.all(
      results.map(async (r) => {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, r.teacherId),
          with: {
            user: {
              columns: { name: true },
            },
          },
        });
        return {
          ...r,
          teacherName: teacher?.user?.name || 'Unknown',
        };
      })
    );

    return withInfo;
  },

  async getRoutineStats() {
    const totalSessions = await db
      .select({ count: count() })
      .from(routines)
      .where(eq(routines.isActive, true));

    const labSessions = await db
      .select({ count: count() })
      .from(routines)
      .innerJoin(subjects, eq(routines.subjectId, subjects.id))
      .where(and(eq(routines.isActive, true), eq(subjects.isLab, true)));

    const total = totalSessions[0]?.count || 1;
    const labs = labSessions[0]?.count || 0;

    return {
      totalSessions: total,
      labSessions: labs,
      theorySessions: total - labs,
      labPercentage: Math.round((labs / total) * 100),
      theoryPercentage: Math.round(((total - labs) / total) * 100),
    };
  },

  async getWeeklyAttendanceTrend() {
    const results = await db
      .select({
        date: sql`DATE(${attendanceSessions.sessionDate})`,
        presentCount: sql`SUM(CASE WHEN ${attendanceRecords.status} = 'PRESENT' THEN 1 ELSE 0 END)`,
        totalCount: count(),
      })
      .from(attendanceRecords)
      .innerJoin(
        attendanceSessions,
        eq(attendanceRecords.sessionId, attendanceSessions.id)
      )
      .where(
        gte(
          attendanceSessions.sessionDate,
          sql`CURRENT_DATE - INTERVAL '7 days'`
        )
      )
      .groupBy(sql`DATE(${attendanceSessions.sessionDate})`)
      .orderBy(asc(sql`DATE(${attendanceSessions.sessionDate})`));

    return results.map((row) => ({
      date: row.date,
      presentCount: parseInt(row.presentCount) || 0,
      totalCount: parseInt(row.totalCount) || 0,
      percentage: row.totalCount > 0
        ? Math.round(((parseInt(row.presentCount) || 0) / row.totalCount) * 100)
        : 0,
    }));
  },
};
