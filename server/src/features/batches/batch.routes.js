import { Router } from 'express';
import { batchController } from './batch.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Batch management (SUPER_ADMIN and ADMIN/HOD)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.create
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.getAll
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.getById
);

// Subject assignment
router.post(
  '/:id/subjects',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.assignSubjects
);

router.delete(
  '/:id/subjects/:subjectId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.removeSubject
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.update
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  batchController.delete
);

export default router;
