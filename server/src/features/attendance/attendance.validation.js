import { z } from 'zod';
import { attendanceStatusEnum } from '../../db/schema/enums.js';

const uuidSchema = z.string().uuid('Invalid UUID format');
const dateSchema = z.string().datetime('Invalid date format, expected ISO 8601');

export const createSessionSchema = z.object({
  routineId: uuidSchema,
  sessionDate: dateSchema,
  topicCovered: z.string().max(500, 'Topic must not exceed 500 characters').optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export const markAttendanceSchema = z.object({
  sessionId: uuidSchema,
  records: z.array(
    z.object({
      studentId: uuidSchema,
      status: z.enum(attendanceStatusEnum.enumValues),
      remarks: z.string().max(255, 'Remarks must not exceed 255 characters').optional(),
    })
  ).min(1, 'At least one attendance record is required'),
});

export const updateAttendanceSchema = z.object({
  sessionId: uuidSchema,
  studentId: uuidSchema,
  status: z.enum(attendanceStatusEnum.enumValues).optional(),
  remarks: z.string().max(255, 'Remarks must not exceed 255 characters').optional(),
});

export const getSessionSchema = z.object({
  sessionId: uuidSchema,
});

export const getStudentAttendanceSchema = z.object({
  studentId: uuidSchema,
  semesterId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const getSubjectAttendanceSchema = z.object({
  subjectId: uuidSchema,
  sessionId: uuidSchema.optional(),
});

export const getRoutineSessionsSchema = z.object({
  routineId: uuidSchema,
});

export const deleteSessionSchema = z.object({
  sessionId: uuidSchema,
});

export const validateCreateSession = (data) => createSessionSchema.parse(data);
export const validateMarkAttendance = (data) => markAttendanceSchema.parse(data);
export const validateUpdateAttendance = (data) => updateAttendanceSchema.parse(data);
export const validateGetSession = (data) => getSessionSchema.parse(data);
export const validateGetStudentAttendance = (data) => getStudentAttendanceSchema.parse(data);
export const validateGetSubjectAttendance = (data) => getSubjectAttendanceSchema.parse(data);
export const validateGetRoutineSessions = (data) => getRoutineSessionsSchema.parse(data);
export const validateDeleteSession = (data) => deleteSessionSchema.parse(data);
