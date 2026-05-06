import { Router } from 'express';
import { teacherController } from './teacher.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), teacherController.getAll);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), teacherController.getById);

export default router;
