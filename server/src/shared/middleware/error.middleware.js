import { env } from '../../config/env.js';
import { logger } from './logging.middleware.js';

// Error code mapping
const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
};

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    error: err.message,
    code: err.code || ERROR_CODES[err.statusCode] || 'INTERNAL_SERVER_ERROR',
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
  }

  // AppError (custom application errors)
  if (err.name === 'AppError') {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || ERROR_CODES[statusCode] || 'INTERNAL_SERVER_ERROR',
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    error: {
      code: ERROR_CODES[statusCode] || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.message;
  }

  res.status(statusCode).json(errorResponse);
};

export class AppError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || ERROR_CODES[statusCode] || 'INTERNAL_SERVER_ERROR';
    this.name = 'AppError';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factories
export const Errors = {
  BadRequest: (message, details) => new AppError(message, 400, 'BAD_REQUEST', details),
  Unauthorized: (message) => new AppError(message || 'Unauthorized', 401, 'UNAUTHORIZED'),
  Forbidden: (message) => new AppError(message || 'Forbidden', 403, 'FORBIDDEN'),
  NotFound: (message) => new AppError(message || 'Resource not found', 404, 'NOT_FOUND'),
  Conflict: (message, details) => new AppError(message, 409, 'CONFLICT', details),
  RateLimit: (message) => new AppError(message || 'Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'),
  Internal: (message) => new AppError(message || 'Internal server error', 500, 'INTERNAL_SERVER_ERROR'),
};
