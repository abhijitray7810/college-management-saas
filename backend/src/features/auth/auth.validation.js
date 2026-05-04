import { z } from 'zod';
import { ROLES } from '../../shared/constants/roles.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must not exceed 255 characters'),
  email: z.string().email('Invalid email format').max(255, 'Email must not exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const validateRegister = (data) => registerSchema.parse(data);
export const validateLogin = (data) => loginSchema.parse(data);
