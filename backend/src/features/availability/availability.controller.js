import { availabilityService } from './availability.service.js';
import {
  validateCreateTeacherAvailability,
  validateCreateRoomAvailability,
  validateGetByTeacherId,
  validateGetByRoomId,
  validateGetAvailableBySlot,
  validateDeleteAvailability,
} from './availability.validation.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const availabilityController = {
  async createTeacherAvailability(req, res, next) {
    try {
      const validatedData = validateCreateTeacherAvailability(req.body);
      const result = await availabilityService.createTeacherAvailability(validatedData);

      res.status(201).json({
        success: true,
        message: 'Teacher availability created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async createRoomAvailability(req, res, next) {
    try {
      const validatedData = validateCreateRoomAvailability(req.body);
      const result = await availabilityService.createRoomAvailability(validatedData);

      res.status(201).json({
        success: true,
        message: 'Room availability created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherAvailability(req, res, next) {
    try {
      const { teacherId } = validateGetByTeacherId(req.params);
      const result = await availabilityService.getTeacherAvailabilityList(teacherId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomAvailability(req, res, next) {
    try {
      const { roomId } = validateGetByRoomId(req.params);
      const result = await availabilityService.getRoomAvailabilityList(roomId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAvailableTeachers(req, res, next) {
    try {
      const { timeSlotId } = validateGetAvailableBySlot(req.params);
      const result = await availabilityService.getAvailableTeachers(timeSlotId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAvailableRooms(req, res, next) {
    try {
      const { timeSlotId } = req.params;
      const { type } = req.query;

      const validatedParams = validateGetAvailableBySlot({
        timeSlotId,
        ...(type && { type }),
      });

      const result = await availabilityService.getAvailableRooms(validatedParams.timeSlotId, {
        type: validatedParams.type,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkTeacherAvailability(req, res, next) {
    try {
      const { teacherId, timeSlotId } = req.params;

      if (!teacherId || !timeSlotId) {
        throw new AppError('Teacher ID and Time Slot ID are required', 400);
      }

      const result = await availabilityService.isTeacherAvailable(teacherId, timeSlotId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkRoomAvailability(req, res, next) {
    try {
      const { roomId, timeSlotId } = req.params;

      if (!roomId || !timeSlotId) {
        throw new AppError('Room ID and Time Slot ID are required', 400);
      }

      const result = await availabilityService.isRoomAvailable(roomId, timeSlotId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAvailabilityConflicts(req, res, next) {
    try {
      const { teacherId, roomId, timeSlotId } = req.body;

      if (!teacherId || !roomId || !timeSlotId) {
        throw new AppError('Teacher ID, Room ID, and Time Slot ID are required', 400);
      }

      const result = await availabilityService.checkAvailabilityConflicts(
        teacherId,
        roomId,
        timeSlotId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteTeacherAvailability(req, res, next) {
    try {
      const { id } = validateDeleteAvailability(req.params);
      await availabilityService.deleteTeacherAvailability(id);

      res.status(200).json({
        success: true,
        message: 'Teacher availability deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRoomAvailability(req, res, next) {
    try {
      const { id } = validateDeleteAvailability(req.params);
      await availabilityService.deleteRoomAvailability(id);

      res.status(200).json({
        success: true,
        message: 'Room availability deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
