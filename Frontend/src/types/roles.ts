// Frontend/src/types/roles.ts

export const CANONICAL_ROLES = [
  'student',
  'college_admin',
  'faculty',
  'company_admin',
  'recruiter',
  'super_admin'
] as const;

export type UserRole = (typeof CANONICAL_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  college_admin: 'College Administrator',
  faculty: 'Faculty Member',
  company_admin: 'Company Administrator',
  recruiter: 'Recruiter',
  super_admin: 'Super Administrator'
};

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: '/student/dashboard',
  college_admin: '/college/dashboard',
  faculty: '/faculty/dashboard',
  company_admin: '/company/dashboard',
  recruiter: '/recruiter/dashboard',
  super_admin: '/admin'
};

/**
 * Returns the canonical dashboard route for a given role.
 */
export function getRoleDashboardPath(role: UserRole | string | undefined | null): string {
  if (!role) return '/login';
  const normalized = normalizeRole(role);
  return ROLE_DASHBOARDS[normalized] || '/';
}

/**
 * Normalizes legacy or variant role strings to canonical UserRole.
 */
export function normalizeRole(role: string): UserRole {
  const r = role.toLowerCase().trim();
  if (r === 'candidate' || r === 'student') return 'student';
  if (r === 'admin' || r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'recruiter') return 'recruiter';
  if (r === 'college_admin' || r === 'collegeadmin') return 'college_admin';
  if (r === 'faculty') return 'faculty';
  if (r === 'company_admin' || r === 'companyadmin') return 'company_admin';
  return 'student';
}

/**
 * Checks if a user's role is in the allowed list, with normalization.
 */
export function isRoleAllowed(userRole: string | undefined | null, allowedRoles?: (UserRole | string)[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.map(r => normalizeRole(r)).includes(normalizedUserRole);
}

export const PUBLIC_SIGNUP_ROLES: UserRole[] = ['student', 'recruiter'];
