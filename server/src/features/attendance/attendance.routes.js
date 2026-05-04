import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Session management (TEACHER, ADMIN)
router.post(
  '/session',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.createSession
);

router.get(
  '/session/:sessionId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  attendanceController.getSession
);

router.get(
  '/routine/:routineId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.getRoutineSessions
);

router.delete(
  '/session/:sessionId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.deleteSession
);

// Attendance marking (TEACHER, ADMIN)
router.post(
  '/mark',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.markAttendance
);

router.post(
  '/mark-all-present/:sessionId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.markAllPresent
);

router.patch(
  '/update/:sessionId/:studentId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.updateAttendance
);

// Attendance reports (ADMIN, TEACHER)
router.get(
  '/subject/:subjectId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  attendanceController.getSubjectAttendance
);

// Student attendance views (ADMIN, TEACHER, STUDENT - own only)
router.get(
  '/student/:studentId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  attendanceController.getStudentAttendance
);

router.get(
  '/my-attendance',
  authorizeRoles(ROLES.STUDENT),
  attendanceController.getMyAttendance
);

export default router;
