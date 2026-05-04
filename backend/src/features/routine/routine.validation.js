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
