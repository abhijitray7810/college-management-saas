import { Router } from 'express';
import { sectionController } from './section.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Section management (SUPER_ADMIN and ADMIN/HOD)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.create
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.getAll
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.getById
);

// Student assignment
router.post(
  '/:id/students',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.assignStudents
);

router.delete(
  '/:id/students/:studentId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.removeStudent
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.update
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  sectionController.delete
);

export default router;
