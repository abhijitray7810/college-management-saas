import { attendanceService } from './attendance.service.js';
import {
  validateCreateSession,
  validateMarkAttendance,
  validateUpdateAttendance,
  validateGetSession,
  validateGetStudentAttendance,
  validateGetSubjectAttendance,
  validateGetRoutineSessions,
  validateDeleteSession,
} from './attendance.validation.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const attendanceController = {
  async createSession(req, res, next) {
    try {
      const validatedData = validateCreateSession(req.body);
      const teacherId = req.user.teacherId || req.user.id;

      const result = await attendanceService.createSession(validatedData, teacherId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async markAttendance(req, res, next) {
    try {
      const validatedData = validateMarkAttendance(req.body);
      const teacherId = req.user.teacherId || req.user.id;

      const result = await attendanceService.markAttendance(validatedData, teacherId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async markAllPresent(req, res, next) {
    try {
      const { sessionId } = validateGetSession(req.params);
      const teacherId = req.user.teacherId || req.user.id;

      const result = await attendanceService.markAllPresent(sessionId, teacherId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateAttendance(req, res, next) {
    try {
      const validatedData = validateUpdateAttendance({
        ...req.body,
        ...req.params,
      });
      const teacherId = req.user.teacherId || req.user.id;

      const result = await attendanceService.updateAttendance(validatedData, teacherId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getSession(req, res, next) {
    try {
      const { sessionId } = validateGetSession(req.params);

      const result = await attendanceService.getSession(sessionId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getRoutineSessions(req, res, next) {
    try {
      const { routineId } = validateGetRoutineSessions(req.params);
      const teacherId = req.user.teacherId || req.user.id;
      const userRole = req.user.role;

      const result = await attendanceService.getRoutineSessions(routineId, teacherId, userRole);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getStudentAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const filters = {
        semesterId: req.query.semesterId,
        subjectId: req.query.subjectId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const validatedData = validateGetStudentAttendance({ studentId, ...filters });

      if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
        throw new AppError('You can only view your own attendance', 403);
      }

      const result = await attendanceService.getStudentAttendance(
        validatedData.studentId,
        validatedData
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMyAttendance(req, res, next) {
    try {
      if (req.user.role !== 'STUDENT' || !req.user.studentId) {
        throw new AppError('Only students can view their own attendance', 403);
      }

      const filters = {
        semesterId: req.query.semesterId,
        subjectId: req.query.subjectId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await attendanceService.getStudentAttendance(req.user.studentId, filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getSubjectAttendance(req, res, next) {
    try {
      const { subjectId } = req.params;
      const filters = {
        sessionId: req.query.sessionId,
      };

      const validatedData = validateGetSubjectAttendance({ subjectId, ...filters });

      const result = await attendanceService.getSubjectAttendance(
        validatedData.subjectId,
        validatedData
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteSession(req, res, next) {
    try {
      const { sessionId } = validateDeleteSession(req.params);
      const teacherId = req.user.teacherId || req.user.id;
      const userRole = req.user.role;

      const result = await attendanceService.deleteSession(sessionId, teacherId, userRole);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
