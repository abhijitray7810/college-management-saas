import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Student dashboard - own data only
router.get(
  '/student',
  authorizeRoles(ROLES.STUDENT),
  dashboardController.getMyDashboard
);

router.get(
  '/student/:studentId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  dashboardController.getStudentDashboard
);

// Teacher dashboard - own data only
router.get(
  '/teacher',
  authorizeRoles(ROLES.TEACHER),
  dashboardController.getMyTeacherDashboard
);

router.get(
  '/teacher/:teacherId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  dashboardController.getTeacherDashboard
);

// Admin dashboard - full analytics
router.get(
  '/admin',
  authorizeRoles(ROLES.ADMIN),
  dashboardController.getAdminDashboard
);

// Quick stats for all authenticated users (limited data)
router.get(
  '/stats',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  dashboardController.getQuickStats
);

export default router;
