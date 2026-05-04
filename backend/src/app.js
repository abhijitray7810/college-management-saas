import express from 'express';
import { errorHandler } from './shared/middleware/error.middleware.js';
import authRoutes from './features/auth/auth.routes.js';
import availabilityRoutes from './features/availability/availability.routes.js';
import routineRoutes from './features/routine/routine.routes.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/routine', routineRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
