import { Router } from 'express';
import { availabilityController } from './availability.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/teacher',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.createTeacherAvailability
);

router.post(
  '/room',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.createRoomAvailability
);

router.get(
  '/teacher/:teacherId',
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  availabilityController.getTeacherAvailability
);

router.get(
  '/room/:roomId',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.getRoomAvailability
);

router.get(
  '/teachers/free/:timeSlotId',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.getAvailableTeachers
);

router.get(
  '/rooms/free/:timeSlotId',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.getAvailableRooms
);

router.get(
  '/check/teacher/:teacherId/:timeSlotId',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.checkTeacherAvailability
);

router.get(
  '/check/room/:roomId/:timeSlotId',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.checkRoomAvailability
);

router.post(
  '/check/conflicts',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.checkAvailabilityConflicts
);

router.delete(
  '/teacher/:id',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.deleteTeacherAvailability
);

router.delete(
  '/room/:id',
  authorizeRoles(ROLES.ADMIN),
  availabilityController.deleteRoomAvailability
);

export default router;
