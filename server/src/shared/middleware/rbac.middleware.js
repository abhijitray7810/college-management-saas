import { ROLE_HIERARCHY } from '../constants/roles.js';
import { AppError } from './error.middleware.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role;
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    const minRequiredLevel = Math.min(
      ...allowedRoles.map((role) => ROLE_HIERARCHY[role] || Infinity)
    );

    if (userRoleLevel < minRequiredLevel) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
