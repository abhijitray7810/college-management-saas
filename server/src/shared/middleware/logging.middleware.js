import pino from 'pino';

// Configure Pino logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request warning');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query,
  }, 'Error occurred');

  next(err);
};

// Export logger instance for use in other modules
export { logger };
