import { z } from 'zod';
import { availabilityStatusEnum } from '../../db/schema/enums.js';

const uuidSchema = z.string().uuid('Invalid UUID format');

const availabilityStatusSchema = z.enum(availabilityStatusEnum.enumValues).refine(
  (val) => val !== 'BOOKED',
  'BOOKED status is automatically managed by the system'
);

export const createTeacherAvailabilitySchema = z.object({
  teacherId: uuidSchema,
  timeSlotId: uuidSchema,
  status: availabilityStatusSchema,
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const createRoomAvailabilitySchema = z.object({
  roomId: uuidSchema,
  timeSlotId: uuidSchema,
  status: availabilityStatusSchema,
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const getByTeacherIdSchema = z.object({
  teacherId: uuidSchema,
});

export const getByRoomIdSchema = z.object({
  roomId: uuidSchema,
});

export const getAvailableBySlotSchema = z.object({
  timeSlotId: uuidSchema,
  type: z.enum(['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM']).optional(),
});

export const deleteAvailabilitySchema = z.object({
  id: uuidSchema,
});

export const validateCreateTeacherAvailability = (data) => createTeacherAvailabilitySchema.parse(data);
export const validateCreateRoomAvailability = (data) => createRoomAvailabilitySchema.parse(data);
export const validateGetByTeacherId = (data) => getByTeacherIdSchema.parse(data);
export const validateGetByRoomId = (data) => getByRoomIdSchema.parse(data);
export const validateGetAvailableBySlot = (data) => getAvailableBySlotSchema.parse(data);
export const validateDeleteAvailability = (data) => deleteAvailabilitySchema.parse(data);
