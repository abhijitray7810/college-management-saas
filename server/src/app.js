import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { requestLogger } from './shared/middleware/logging.middleware.js';
import {
  helmet,
  helmetConfig,
  cors,
  corsOptions,
  standardLimiter,
  sanitizeInput,
} from './shared/middleware/security.middleware.js';
import authRoutes from './features/auth/auth.routes.js';
import availabilityRoutes from './features/availability/availability.routes.js';
import routineRoutes from './features/routine/routine.routes.js';
import attendanceRoutes from './features/attendance/attendance.routes.js';
import dashboardRoutes from './features/dashboard/dashboard.routes.js';
import exportRoutes from './features/export/export.routes.js';

const app = express();

// Security middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(standardLimiter);
app.use(sanitizeInput);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'College Management SaaS API',
      version: '1.0.0',
      description: 'Production-grade College Management System API',
      contact: {
        name: 'API Support',
        email: 'support@college.edu',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/features/**/*.routes.js', './src/features/**/*.controller.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route does not exist',
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
