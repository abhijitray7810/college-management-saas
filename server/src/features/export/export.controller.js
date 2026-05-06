import { exportService } from './export.service.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const exportController = {
  async exportRoutinePDF(req, res, next) {
    try {
      const { semesterId } = req.params;
      
      if (!semesterId) {
        throw new AppError('Semester ID is required', 400);
      }

      const result = await exportService.generateRoutinePDF(semesterId);

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(result.data.buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportRoutinePDFBySection(req, res, next) {
    try {
      const { sectionId } = req.params;

      if (!sectionId) {
        throw new AppError('Section ID is required', 400);
      }

      const result = await exportService.generateRoutinePDFBySection(sectionId);

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(result.data.buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportStudentAttendancePDF(req, res, next) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        throw new AppError('Student ID is required', 400);
      }

      // Students can only export their own attendance
      if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
        throw new AppError('You can only export your own attendance report', 403);
      }

      const result = await exportService.generateStudentAttendancePDF(studentId);

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(result.data.buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportSubjectAttendancePDF(req, res, next) {
    try {
      const { subjectId } = req.params;
      
      if (!subjectId) {
        throw new AppError('Subject ID is required', 400);
      }

      const result = await exportService.generateSubjectAttendancePDF(subjectId);

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(result.data.buffer);
    } catch (error) {
      next(error);
    }
  },
};
