import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid UUID format');

export const generateRoutineSchema = z.object({
  semesterId: uuidSchema,
  academicYear: z.string().min(4).max(20).optional(),
  preferSpreadAcrossDays: z.boolean().optional().default(true),
  prioritizeLabs: z.boolean().optional().default(true),
  maxIterations: z.number().int().min(100).max(100000).optional().default(10000),
});

export const getRoutineSchema = z.object({
  semesterId: uuidSchema,
});

export const deleteRoutineSchema = z.object({
  semesterId: uuidSchema,
});

export const validateGenerateRoutine = (data) => generateRoutineSchema.parse(data);
export const validateGetRoutine = (data) => getRoutineSchema.parse(data);
export const validateDeleteRoutine = (data) => deleteRoutineSchema.parse(data);

// Manual Override Schemas
export const updateRoutineSchema = z.object({
  routineId: uuidSchema,
  teacherId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  timeSlotId: uuidSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const swapRoutinesSchema = z.object({
  routineId1: uuidSchema,
  routineId2: uuidSchema,
});

export const lockRoutineSchema = z.object({
  routineId: uuidSchema,
  isLocked: z.boolean(),
});

export const bulkLockSchema = z.object({
  semesterId: uuidSchema,
  isLocked: z.boolean().default(true),
});

export const routineIdSchema = z.object({
  routineId: uuidSchema,
});

export const validateUpdateRoutine = (data) => updateRoutineSchema.parse(data);
export const validateSwapRoutines = (data) => swapRoutinesSchema.parse(data);
export const validateLockRoutine = (data) => lockRoutineSchema.parse(data);
export const validateBulkLock = (data) => bulkLockSchema.parse(data);
export const validateRoutineId = (data) => routineIdSchema.parse(data);
