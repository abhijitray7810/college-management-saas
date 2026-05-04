export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
};

export const DEFAULT_ROLE = ROLES.STUDENT;

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 3,
  [ROLES.TEACHER]: 2,
  [ROLES.STUDENT]: 1,
};
