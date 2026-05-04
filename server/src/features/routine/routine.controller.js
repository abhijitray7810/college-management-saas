import { routineService } from './routine.service.js';
import {
  validateGenerateRoutine,
  validateGetRoutine,
  validateDeleteRoutine,
  validateUpdateRoutine,
  validateSwapRoutines,
  validateLockRoutine,
  validateBulkLock,
  validateRoutineId,
} from './routine.validation.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const routineController = {
  async generateRoutine(req, res, next) {
    try {
      const validatedData = validateGenerateRoutine(req.body);
      
      // Prevent timeout for long-running generation
      req.setTimeout(300000); // 5 minutes
      
      const result = await routineService.generateRoutine(validatedData);

      if (!result.success) {
        return res.status(422).json({
          success: false,
          message: result.message,
          stats: result.stats,
        });
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoutineBySemester(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const result = await routineService.getRoutineBySemester(semesterId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getGenerationPreview(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const result = await routineService.getGenerationPreview(semesterId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteRoutine(req, res, next) {
    try {
      const { semesterId } = validateDeleteRoutine(req.params);
      const result = await routineService.deleteRoutineBySemester(semesterId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deactivateRoutine(req, res, next) {
    try {
      const { semesterId } = validateDeleteRoutine(req.params);
      const result = await routineService.deactivateRoutineBySemester(semesterId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async validateConstraints(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const result = await routineService.validateConstraints(semesterId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getRoutineByDay(req, res, next) {
    try {
      const { semesterId, day } = req.params;
      
      if (!semesterId || !day) {
        throw new AppError('Semester ID and day are required', 400);
      }

      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      if (!validDays.includes(day.toUpperCase())) {
        throw new AppError(`Invalid day. Must be one of: ${validDays.join(', ')}`, 400);
      }

      const result = await routineService.getRoutineBySemester(semesterId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      const dayRoutine = result.data.groupedByDay[day.toUpperCase()] || [];

      res.status(200).json({
        success: true,
        data: {
          semester: result.data.semester,
          day: day.toUpperCase(),
          sessions: dayRoutine,
          sessionCount: dayRoutine.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherRoutine(req, res, next) {
    try {
      const { semesterId, teacherId } = req.params;

      if (!semesterId || !teacherId) {
        throw new AppError('Semester ID and Teacher ID are required', 400);
      }

      const result = await routineService.getRoutineBySemester(semesterId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      const teacherRoutines = result.data.routines.filter(
        (r) => r.teacherId === teacherId
      );

      // Group by day
      const byDay = {};
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      
      for (const day of days) {
        byDay[day] = teacherRoutines
          .filter((r) => r.timeSlot?.day === day)
          .sort((a, b) => a.timeSlot.slotNumber - b.timeSlot.slotNumber);
      }

      res.status(200).json({
        success: true,
        data: {
          semester: result.data.semester,
          teacherId,
          teacherName: teacherRoutines[0]?.teacher?.user?.name || 'Unknown',
          totalSessions: teacherRoutines.length,
          byDay,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getStudentRoutine(req, res, next) {
    try {
      const { semesterId } = req.params;

      if (!semesterId) {
        throw new AppError('Semester ID is required', 400);
      }

      // Students see the full semester routine (they're all in same classes)
      const result = await routineService.getRoutineBySemester(semesterId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        data: {
          semester: result.data.semester,
          totalSessions: result.data.totalSessions,
          uniqueSubjects: result.data.uniqueSubjects,
          groupedByDay: result.data.groupedByDay,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== MANUAL OVERRIDE CONTROLLERS ==============

  async updateRoutine(req, res, next) {
    try {
      const validatedData = validateUpdateRoutine({
        routineId: req.params.id,
        ...req.body,
      });
      const updatedBy = req.user.id;

      const result = await routineService.updateRoutine(
        validatedData.routineId,
        validatedData,
        updatedBy
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async swapRoutines(req, res, next) {
    try {
      const validatedData = validateSwapRoutines(req.body);
      const updatedBy = req.user.id;

      const result = await routineService.swapRoutines(
        validatedData.routineId1,
        validatedData.routineId2,
        updatedBy
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async lockRoutine(req, res, next) {
    try {
      const validatedData = validateLockRoutine({
        routineId: req.params.id,
        isLocked: req.body.isLocked,
      });
      const updatedBy = req.user.id;

      const result = await routineService.lockRoutine(
        validatedData.routineId,
        validatedData.isLocked,
        updatedBy
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async bulkLockRoutines(req, res, next) {
    try {
      const validatedData = validateBulkLock(req.body);
      const updatedBy = req.user.id;

      const result = await routineService.bulkLockRoutines(
        validatedData.semesterId,
        validatedData.isLocked,
        updatedBy
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getRoutineById(req, res, next) {
    try {
      const { routineId } = validateRoutineId({ routineId: req.params.id });
      const result = await routineService.getRoutineById(routineId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ============== APPROVAL WORKFLOW CONTROLLERS ==============

  async submitForApproval(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const updatedBy = req.user.id;

      const result = await routineService.submitForApproval(semesterId, updatedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async approveRoutine(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const updatedBy = req.user.id;

      const result = await routineService.approveRoutine(semesterId, updatedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async rejectRoutine(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const { reason } = req.body;
      const updatedBy = req.user.id;

      const result = await routineService.rejectRoutine(semesterId, reason, updatedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async activateRoutine(req, res, next) {
    try {
      const { semesterId } = validateGetRoutine(req.params);
      const updatedBy = req.user.id;

      const result = await routineService.activateRoutine(semesterId, updatedBy);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getPendingRoutines(req, res, next) {
    try {
      const result = await routineService.getPendingRoutines();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
