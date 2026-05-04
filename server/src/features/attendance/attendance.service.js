import { attendanceRepository } from './attendance.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const attendanceService = {
  async createSession(data, teacherId) {
    const { routineId, sessionDate, topicCovered, notes } = data;

    const routine = await attendanceRepository.getRoutineById(routineId);
    if (!routine) {
      throw new AppError('Routine not found', 404);
    }

    if (routine.teacherId !== teacherId) {
      throw new AppError('You are not assigned to this routine', 403);
    }

    const duplicate = await attendanceRepository.checkDuplicateSession(routineId, sessionDate);
    if (duplicate) {
      throw new AppError(
        'Attendance session already exists for this routine on this date',
        409
      );
    }

    const session = await attendanceRepository.createSession({
      routineId,
      teacherId,
      timeSlotId: routine.timeSlotId,
      sessionDate,
      topicCovered,
      notes,
    });

    return {
      success: true,
      message: 'Attendance session created successfully',
      data: {
        ...session,
        routine: {
          subject: routine.subject,
          semester: routine.semester,
          timeSlot: routine.timeSlot,
        },
      },
    };
  },

  async markAttendance(data, teacherId) {
    const { sessionId, records } = data;

    const session = await attendanceRepository.getSessionById(sessionId);
    if (!session) {
      throw new AppError('Attendance session not found', 404);
    }

    if (session.teacherId !== teacherId) {
      throw new AppError('Only the assigned teacher can mark attendance', 403);
    }

    const semesterId = session.routine.semester.id;
    const students = await attendanceRepository.getStudentsBySemester(semesterId);
    const studentIds = new Set(students.map((s) => s.id));

    for (const record of records) {
      if (!studentIds.has(record.studentId)) {
        throw new AppError(
          `Student ${record.studentId} is not enrolled in this semester`,
          400
        );
      }
    }

    const attendanceRecords = await attendanceRepository.bulkInsertAttendance(
      sessionId,
      records
    );

    const stats = await attendanceRepository.getSessionAttendanceStats(sessionId);

    return {
      success: true,
      message: `Attendance marked for ${attendanceRecords.length} students`,
      data: {
        sessionId,
        markedCount: attendanceRecords.length,
        stats: {
          totalStudents: stats.totalStudents,
          presentCount: parseInt(stats.presentCount) || 0,
          absentCount: parseInt(stats.absentCount) || 0,
          lateCount: parseInt(stats.lateCount) || 0,
          excusedCount: parseInt(stats.excusedCount) || 0,
        },
      },
    };
  },

  async markAllPresent(sessionId, teacherId) {
    const session = await attendanceRepository.getSessionById(sessionId);
    if (!session) {
      throw new AppError('Attendance session not found', 404);
    }

    if (session.teacherId !== teacherId) {
      throw new AppError('Only the assigned teacher can mark attendance', 403);
    }

    const semesterId = session.routine.semester.id;
    const students = await attendanceRepository.getStudentsBySemester(semesterId);

    const records = students.map((student) => ({
      studentId: student.id,
      status: 'PRESENT',
      remarks: 'Marked all present',
    }));

    const attendanceRecords = await attendanceRepository.bulkInsertAttendance(
      sessionId,
      records
    );

    const stats = await attendanceRepository.getSessionAttendanceStats(sessionId);

    return {
      success: true,
      message: `All ${attendanceRecords.length} students marked present`,
      data: {
        sessionId,
        markedCount: attendanceRecords.length,
        stats: {
          totalStudents: stats.totalStudents,
          presentCount: parseInt(stats.presentCount) || 0,
          absentCount: parseInt(stats.absentCount) || 0,
          lateCount: parseInt(stats.lateCount) || 0,
          excusedCount: parseInt(stats.excusedCount) || 0,
        },
      },
    };
  },

  async updateAttendance(data, teacherId) {
    const { sessionId, studentId, status, remarks } = data;

    const session = await attendanceRepository.getSessionById(sessionId);
    if (!session) {
      throw new AppError('Attendance session not found', 404);
    }

    if (session.teacherId !== teacherId) {
      throw new AppError('Only the assigned teacher can update attendance', 403);
    }

    const existingRecord = await attendanceRepository.getAttendanceRecord(sessionId, studentId);
    if (!existingRecord) {
      throw new AppError('Attendance record not found for this student', 404);
    }

    const updatedRecord = await attendanceRepository.updateAttendanceRecord(sessionId, studentId, {
      status,
      remarks,
    });

    return {
      success: true,
      message: 'Attendance record updated successfully',
      data: updatedRecord,
    };
  },

  async getSession(sessionId) {
    const session = await attendanceRepository.getSessionById(sessionId);
    if (!session) {
      throw new AppError('Attendance session not found', 404);
    }

    const stats = await attendanceRepository.getSessionAttendanceStats(sessionId);

    return {
      success: true,
      data: {
        ...session,
        stats: {
          totalStudents: stats.totalStudents,
          presentCount: parseInt(stats.presentCount) || 0,
          absentCount: parseInt(stats.absentCount) || 0,
          lateCount: parseInt(stats.lateCount) || 0,
          excusedCount: parseInt(stats.excusedCount) || 0,
          attendancePercentage: stats.totalStudents > 0
            ? Math.round(((parseInt(stats.presentCount) || 0) / stats.totalStudents) * 100)
            : 0,
        },
      },
    };
  },

  async getRoutineSessions(routineId, teacherId, userRole) {
    const routine = await attendanceRepository.getRoutineById(routineId);
    if (!routine) {
      throw new AppError('Routine not found', 404);
    }

    if (userRole !== 'ADMIN' && routine.teacherId !== teacherId) {
      throw new AppError('You are not assigned to this routine', 403);
    }

    const sessions = await attendanceRepository.getSessionsByRoutine(routineId);

    return {
      success: true,
      data: {
        routine: {
          id: routine.id,
          subject: routine.subject,
          semester: routine.semester,
          timeSlot: routine.timeSlot,
        },
        sessions,
        totalSessions: sessions.length,
      },
    };
  },

  async getStudentAttendance(studentId, filters = {}) {
    const summary = await attendanceRepository.getStudentAttendanceSummary(studentId, filters);

    let totalSessions = 0;
    let totalPresent = 0;

    const subjectWise = summary.map((row) => {
      const subjectTotal = parseInt(row.totalSessions) || 0;
      const present = parseInt(row.presentCount) || 0;
      const late = parseInt(row.lateCount) || 0;
      const excused = parseInt(row.excusedCount) || 0;
      const absent = parseInt(row.absentCount) || 0;

      totalSessions += subjectTotal;
      totalPresent += present + late;

      const effectivePresent = present + late;
      const percentage = subjectTotal > 0
        ? Math.round((effectivePresent / subjectTotal) * 100)
        : 0;

      return {
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        subjectCode: row.subjectCode,
        totalSessions: subjectTotal,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        excusedCount: excused,
        percentage,
      };
    });

    const overallPercentage = totalSessions > 0
      ? Math.round((totalPresent / totalSessions) * 100)
      : 0;

    return {
      success: true,
      data: {
        studentId,
        overall: {
          totalSessions,
          totalPresent,
          percentage: overallPercentage,
        },
        subjectWise,
      },
    };
  },

  async getSubjectAttendance(subjectId, filters = {}) {
    const summary = await attendanceRepository.getSubjectAttendanceSummary(subjectId, filters);

    const studentWise = summary.map((row) => {
      const total = parseInt(row.totalSessions) || 0;
      const present = parseInt(row.presentCount) || 0;
      const late = parseInt(row.lateCount) || 0;
      const absent = parseInt(row.absentCount) || 0;
      const excused = parseInt(row.excusedCount) || 0;

      const effectivePresent = present + late;
      const percentage = total > 0
        ? Math.round((effectivePresent / total) * 100)
        : 0;

      return {
        studentId: row.studentId,
        enrollmentNumber: row.enrollmentNumber,
        studentName: row.studentName,
        totalSessions: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        excusedCount: excused,
        percentage,
        status: percentage >= 75 ? 'GOOD' : percentage >= 60 ? 'AVERAGE' : 'POOR',
      };
    });

    const classAverage = studentWise.length > 0
      ? Math.round(studentWise.reduce((acc, s) => acc + s.percentage, 0) / studentWise.length)
      : 0;

    return {
      success: true,
      data: {
        subjectId,
        classAverage,
        totalStudents: studentWise.length,
        studentWise,
      },
    };
  },

  async deleteSession(sessionId, teacherId, userRole) {
    const session = await attendanceRepository.getSessionById(sessionId);
    if (!session) {
      throw new AppError('Attendance session not found', 404);
    }

    if (userRole !== 'ADMIN' && session.teacherId !== teacherId) {
      throw new AppError('Only admin or assigned teacher can delete session', 403);
    }

    await attendanceRepository.deleteAttendanceRecordsBySession(sessionId);
    await attendanceRepository.deleteSession(sessionId);

    return {
      success: true,
      message: 'Attendance session and records deleted successfully',
    };
  },
};
