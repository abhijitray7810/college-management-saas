import { Router } from 'express';
import { roomController } from './room.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), roomController.getAll);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), roomController.getById);

export default router;
