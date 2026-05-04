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

// Approval Workflow endpoints (ADMIN only)
router.post(
  '/submit/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.submitForApproval
);

router.post(
  '/approve/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.approveRoutine
);

router.post(
  '/reject/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.rejectRoutine
);

router.post(
  '/activate/:semesterId',
  authorizeRoles(ROLES.ADMIN),
  routineController.activateRoutine
);

router.get(
  '/pending',
  authorizeRoles(ROLES.ADMIN),
  routineController.getPendingRoutines
);

// Manual Override endpoints (ADMIN only)
router.patch(
  '/update/:id',
  authorizeRoles(ROLES.ADMIN),
  routineController.updateRoutine
);

router.post(
  '/swap',
  authorizeRoles(ROLES.ADMIN),
  routineController.swapRoutines
);

router.patch(
  '/lock/:id',
  authorizeRoles(ROLES.ADMIN),
  routineController.lockRoutine
);

router.post(
  '/lock/bulk',
  authorizeRoles(ROLES.ADMIN),
  routineController.bulkLockRoutines
);

router.get(
  '/detail/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  routineController.getRoutineById
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
