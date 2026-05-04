import { dashboardService } from './dashboard.service.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const dashboardController = {
  async getStudentDashboard(req, res, next) {
    try {
      const studentId = req.user.studentId || req.params.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found', 400);
      }

      // Students can only view their own dashboard
      if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
        throw new AppError('You can only view your own dashboard', 403);
      }

      const result = await dashboardService.getStudentDashboard(studentId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMyDashboard(req, res, next) {
    try {
      if (req.user.role !== 'STUDENT' || !req.user.studentId) {
        throw new AppError('Only students can access this endpoint', 403);
      }

      const result = await dashboardService.getStudentDashboard(req.user.studentId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getTeacherDashboard(req, res, next) {
    try {
      const teacherId = req.user.teacherId || req.params.teacherId;

      if (!teacherId) {
        throw new AppError('Teacher ID not found', 400);
      }

      // Teachers can only view their own dashboard
      if (req.user.role === 'TEACHER' && req.user.teacherId !== teacherId) {
        throw new AppError('You can only view your own dashboard', 403);
      }

      const result = await dashboardService.getTeacherDashboard(teacherId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMyTeacherDashboard(req, res, next) {
    try {
      if (req.user.role !== 'TEACHER' || !req.user.teacherId) {
        throw new AppError('Only teachers can access this endpoint', 403);
      }

      const result = await dashboardService.getTeacherDashboard(req.user.teacherId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAdminDashboard(req, res, next) {
    try {
      const result = await dashboardService.getAdminDashboard();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getQuickStats(req, res, next) {
    try {
      const result = await dashboardService.getAdminDashboard();

      // Return only the counts and quick stats
      res.status(200).json({
        success: true,
        data: {
          counts: result.data.counts,
          attendance: {
            overallPercentage: result.data.attendance.overallPercentage,
          },
          alerts: result.data.alerts,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
