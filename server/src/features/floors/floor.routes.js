import { Router } from 'express';
import { floorController } from './floor.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Floor management (SUPER_ADMIN only)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN),
  floorController.create
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  floorController.getAll
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  floorController.getById
);

// Assign floor to department (SUPER_ADMIN only)
router.patch(
  '/:id/assign-department',
  authorizeRoles(ROLES.SUPER_ADMIN),
  floorController.assignToDepartment
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  floorController.update
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  floorController.delete
);

export default router;
