import { verifyToken } from '../utils/token.js';
import { AppError } from './error.middleware.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required', 401));
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new AppError('Invalid or expired token', 401));
  }

  req.user = decoded;
  next();
};
