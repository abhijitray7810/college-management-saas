export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',        // HOD level
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
};

export const DEFAULT_ROLE = ROLES.STUDENT;

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.TEACHER]: 2,
  [ROLES.STUDENT]: 1,
};

// Permission levels for hierarchical access
export const PERMISSIONS = {
  MANAGE_INFRASTRUCTURE: [ROLES.SUPER_ADMIN],           // Buildings, floors
  MANAGE_DEPARTMENTS: [ROLES.SUPER_ADMIN],               // Create departments, assign HODs
  MANAGE_ACADEMIC_STRUCTURE: [ROLES.SUPER_ADMIN, ROLES.ADMIN], // Batches, sections, subjects
  MANAGE_TEACHERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],     // Add teachers, assign subjects
  MANAGE_STUDENTS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],     // Add students, assign sections
  MANAGE_ROUTINES: [ROLES.SUPER_ADMIN, ROLES.ADMIN],     // Generate routines
  MANAGE_ATTENDANCE: [ROLES.TEACHER],                    // Mark attendance
  VIEW_ROUTINES: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  VIEW_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
};
