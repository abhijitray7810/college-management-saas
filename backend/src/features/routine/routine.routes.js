import { Router } from 'express';
import { routineController } from './routine.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

// Generation endpoints (ADMIN only)
router.post(
  '/generate',
  authorizeRoles(ROLES.ADMIN),
  routineController.generateRoutine
);

router.get(
  '/preview/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.getGenerationPreview
);

// Management endpoints (ADMIN only)
router.delete(
  '/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.deleteRoutine
);

router.patch(
  '/:semesterId/deactivate',
  authorizeRoles(ROLES.ADMIN),
  routineController.deactivateRoutine
);

router.get(
  '/:semesterId/validate',
  authorizeRoles(ROLES.ADMIN),
  routineController.validateConstraints
);

// View endpoints (ADMIN, TEACHER, STUDENT)
router.get(
  '/:semesterId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  routineController.getRoutineBySemester
);

router.get(
  '/:semesterId/day/:day',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  routineController.getRoutineByDay
);

router.get(
  '/:semesterId/teacher/:teacherId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  routineController.getTeacherRoutine
);

router.get(
  '/:semesterId/student',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  routineController.getStudentRoutine
);

export default router;
