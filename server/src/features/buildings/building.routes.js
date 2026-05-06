import { Router } from 'express';
import { buildingController } from './building.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// All building routes require SUPER_ADMIN
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN),
  buildingController.create
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  buildingController.getAll
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  buildingController.getById
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  buildingController.update
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  buildingController.delete
);

export default router;
