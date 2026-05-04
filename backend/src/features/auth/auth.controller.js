import { authService } from './auth.service.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const authController = {
  async register(req, res, next) {
    try {
      const validatedData = validateRegister(req.body);
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const validatedData = validateLogin(req.body);
      const result = await authService.login(validatedData);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const user = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};
