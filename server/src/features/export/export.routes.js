import { Router } from 'express';
import { exportController } from './export.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Export routine timetable (ADMIN, TEACHER)
router.get(
  '/routine/:semesterId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  exportController.exportRoutinePDF
);

// Export student attendance (ADMIN, TEACHER, STUDENT - own only)
router.get(
  '/attendance/student/:studentId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  exportController.exportStudentAttendancePDF
);

// Export subject/class attendance (ADMIN, TEACHER)
router.get(
  '/attendance/subject/:subjectId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  exportController.exportSubjectAttendancePDF
);

export default router;
