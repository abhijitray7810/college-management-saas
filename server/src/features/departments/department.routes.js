import { Router } from 'express';
import { departmentController } from './department.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth.middleware.js';
import { authorizeRoles } from '../../shared/middleware/rbac.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), departmentController.getAll);
router.get('/my', authorizeRoles(ROLES.ADMIN), departmentController.getMyDepartment);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), departmentController.getById);

export default router;
