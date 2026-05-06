import { Router } from 'express';
import { timeSlotController } from './timeSlot.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', timeSlotController.getAll);
router.get('/day/:day', timeSlotController.getByDay);
router.get('/:id', timeSlotController.getById);

export default router;
