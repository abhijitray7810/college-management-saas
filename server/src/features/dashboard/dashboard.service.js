import { dashboardRepository } from './dashboard.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const dashboardService = {
  // ============== STUDENT DASHBOARD ==============

  async getStudentDashboard(studentId) {
    const student = await dashboardRepository.getStudentInfo(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const [attendanceSummary, subjectWise, todaySchedule] = await Promise.all([
      dashboardRepository.getStudentAttendanceSummary(studentId),
      dashboardRepository.getStudentSubjectWiseAttendance(studentId),
      this.getTodayStudentSchedule(studentId),
    ]);

    const upcomingSchedule = await this.getUpcomingStudentSchedule(studentId);

    const totalSessions = parseInt(attendanceSummary?.totalSessions) || 0;
    const presentCount = parseInt(attendanceSummary?.presentCount) || 0;
    const lateCount = parseInt(attendanceSummary?.lateCount) || 0;
    const absentCount = parseInt(attendanceSummary?.absentCount) || 0;

    const overallPercentage = totalSessions > 0
      ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
      : 0;

    const subjectSummaries = subjectWise.map((subject) => {
      const subjectTotal = parseInt(subject.totalSessions) || 0;
      const subjectPresent = parseInt(subject.presentCount) || 0;
      const subjectLate = parseInt(subject.lateCount) || 0;
      const percentage = subjectTotal > 0
        ? Math.round(((subjectPresent + subjectLate) / subjectTotal) * 100)
        : 0;

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        totalSessions: subjectTotal,
        presentCount: parseInt(subject.presentCount) || 0,
        absentCount: parseInt(subject.absentCount) || 0,
        lateCount: parseInt(subject.lateCount) || 0,
        percentage,
        isLowAttendance: percentage < 75,
      };
    });

    const lowAttendanceSubjects = subjectSummaries.filter((s) => s.isLowAttendance);

    return {
      success: true,
      data: {
        summary: {
          studentId: student.id,
          name: student.user?.name,
          email: student.user?.email,
          enrollmentNumber: student.enrollmentNumber,
          course: student.batch?.name,
          department: student.batch?.department?.name,
          section: student.studentSections?.[0]?.section?.name,
          academicYear: student.batch?.academicYear,
        },
        attendance: {
          overallPercentage,
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          excusedCount: parseInt(attendanceSummary?.excusedCount) || 0,
        },
        subjects: subjectSummaries,
        alerts: {
          lowAttendanceSubjects: lowAttendanceSubjects.length,
          lowAttendanceDetails: lowAttendanceSubjects,
        },
        schedule: {
          today: todaySchedule,
          upcoming: upcomingSchedule,
        },
      },
    };
  },

  async getTodayStudentSchedule(studentId) {
    const today = new Date();
    const dayOfWeek = DAYS[today.getDay()];

    const schedule = await dashboardRepository.getStudentTodaySchedule(studentId, dayOfWeek);

    return schedule.map((item) => ({
      routineId: item.id,
      subject: {
        id: item.subject?.id,
        name: item.subject?.name,
        code: item.subject?.code,
        isLab: item.subject?.isLab,
      },
      teacher: {
        id: item.teacher?.id,
        name: item.teacher?.user?.name,
      },
      room: {
        id: item.room?.id,
        code: item.room?.code,
        name: item.room?.name,
      },
      timeSlot: item.timeSlot,
    }));
  },

  async getUpcomingStudentSchedule(studentId) {
    const today = new Date();
    const dayOfWeek = DAYS[today.getDay()];

    const schedule = await dashboardRepository.getStudentUpcomingSchedule(
      studentId,
      dayOfWeek,
      2
    );

    return schedule.map((item) => ({
      routineId: item.id,
      subject: {
        id: item.subject?.id,
        name: item.subject?.name,
        code: item.subject?.code,
      },
      teacher: {
        id: item.teacher?.id,
        name: item.teacher?.user?.name,
      },
      room: {
        id: item.room?.id,
        code: item.room?.code,
      },
      timeSlot: item.timeSlot,
    }));
  },

  // ============== TEACHER DASHBOARD ==============

  async getTeacherDashboard(teacherId) {
    const teacher = await dashboardRepository.getTeacherInfo(teacherId);
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    const [
      todayClasses,
      weeklyLoad,
      subjectDistribution,
      pendingAttendance,
    ] = await Promise.all([
      this.getTodayTeacherClasses(teacherId),
      dashboardRepository.getTeacherWeeklyLoad(teacherId),
      dashboardRepository.getTeacherSubjectDistribution(teacherId),
      dashboardRepository.getTeacherPendingAttendance(teacherId),
    ]);

    const totalSubjects = subjectDistribution.length;
    const maxSessions = Math.max(...subjectDistribution.map((s) => s.sessionCount), 0);
    const minSessions = Math.min(...subjectDistribution.map((s) => s.sessionCount), weeklyLoad);

    return {
      success: true,
      data: {
        summary: {
          teacherId: teacher.id,
          name: teacher.user?.name,
          email: teacher.user?.email,
          employeeId: teacher.employeeId,
          designation: teacher.designation,
        },
        schedule: {
          today: todayClasses,
          todayCount: todayClasses.length,
        },
        workload: {
          weeklySessions: weeklyLoad,
          totalSubjects,
          averageSessionsPerSubject: totalSubjects > 0 ? Math.round(weeklyLoad / totalSubjects) : 0,
          maxSessionsPerSubject: maxSessions,
          minSessionsPerSubject: minSessions,
        },
        subjects: subjectDistribution.map((s) => ({
          subjectId: s.subjectId,
          name: s.subjectName,
          code: s.subjectCode,
          sessionCount: s.sessionCount,
        })),
        alerts: {
          pendingAttendanceCount: pendingAttendance.length,
          pendingSessions: pendingAttendance.map((p) => ({
            sessionId: p.id,
            subject: p.routine?.subject?.name,
            section: p.routine?.section?.name,
            date: p.sessionDate,
            topic: p.topicCovered,
          })),
        },
      },
    };
  },

  async getTodayTeacherClasses(teacherId) {
    const today = new Date();
    const dayOfWeek = DAYS[today.getDay()];

    const classes = await dashboardRepository.getTeacherTodayClasses(teacherId, dayOfWeek);

    return classes.map((item) => ({
      routineId: item.id,
      subject: {
        id: item.subject?.id,
        name: item.subject?.name,
        code: item.subject?.code,
      },
      semester: {
        id: item.semester?.id,
        name: item.semester?.name,
      },
      room: {
        id: item.room?.id,
        code: item.room?.code,
        name: item.room?.name,
      },
      timeSlot: item.timeSlot,
    }));
  },

  // ============== ADMIN DASHBOARD ==============

  async getAdminDashboard() {
    const [
      counts,
      attendanceStats,
      lowAttendanceStudents,
      roomUtilization,
      teacherLoad,
      routineStats,
      weeklyTrend,
    ] = await Promise.all([
      dashboardRepository.getAdminCounts(),
      dashboardRepository.getOverallAttendanceStats(),
      dashboardRepository.getLowAttendanceStudents(75),
      dashboardRepository.getRoomUtilization(),
      dashboardRepository.getTeacherLoadDistribution(),
      dashboardRepository.getRoutineStats(),
      dashboardRepository.getWeeklyAttendanceTrend(),
    ]);

    const totalRecords = parseInt(attendanceStats?.totalRecords) || 0;
    const presentCount = parseInt(attendanceStats?.presentCount) || 0;
    const lateCount = parseInt(attendanceStats?.lateCount) || 0;

    const overallAttendancePercentage = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : 0;

    const avgRoomUtilization = roomUtilization.length > 0
      ? Math.round(
          roomUtilization.reduce((acc, r) => acc + r.utilizationPercentage, 0) /
            roomUtilization.length
        )
      : 0;

    const avgTeacherLoad = teacherLoad.length > 0
      ? Math.round(
          teacherLoad.reduce((acc, t) => acc + t.sessionCount, 0) / teacherLoad.length
        )
      : 0;

    const maxTeacherLoad = Math.max(...teacherLoad.map((t) => t.sessionCount), 0);
    const overloadedTeachers = teacherLoad.filter((t) => t.sessionCount > avgTeacherLoad * 1.5);

    return {
      success: true,
      data: {
        counts: {
          students: counts.students,
          teachers: counts.teachers,
          subjects: counts.subjects,
          rooms: counts.rooms,
          activeSemesters: counts.activeSemesters,
        },
        attendance: {
          overallPercentage: overallAttendancePercentage,
          totalRecords,
          presentCount,
          absentCount: parseInt(attendanceStats?.absentCount) || 0,
          lateCount,
          excusedCount: parseInt(attendanceStats?.excusedCount) || 0,
        },
        alerts: {
          lowAttendanceStudents: lowAttendanceStudents.length,
          overloadedTeachers: overloadedTeachers.length,
          overloadedTeacherDetails: overloadedTeachers.map((t) => ({
            teacherId: t.teacherId,
            name: t.teacherName,
            sessionCount: t.sessionCount,
          })),
        },
        utilization: {
          averageRoomUtilization: avgRoomUtilization,
          roomDetails: roomUtilization,
          averageTeacherLoad: avgTeacherLoad,
          maxTeacherLoad,
          teacherDistribution: teacherLoad.slice(0, 10),
        },
        routineStats: {
          totalSessions: routineStats.totalSessions,
          labSessions: routineStats.labSessions,
          theorySessions: routineStats.theorySessions,
          labPercentage: routineStats.labPercentage,
          theoryPercentage: routineStats.theoryPercentage,
        },
        trends: {
          weeklyAttendance: weeklyTrend,
        },
      },
    };
  },
};
