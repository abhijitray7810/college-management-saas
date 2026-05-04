import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateJWT, authController.me);

export default router;
