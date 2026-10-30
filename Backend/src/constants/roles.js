// Backend/src/constants/roles.js

export const ROLES = {
  STUDENT: 'student',
  COLLEGE_ADMIN: 'college_admin',
  FACULTY: 'faculty',
  COMPANY_ADMIN: 'company_admin',
  RECRUITER: 'recruiter',
  SUPER_ADMIN: 'super_admin'
};

export const CANONICAL_ROLES = Object.values(ROLES);

export const PUBLIC_SIGNUP_ROLES = [ROLES.STUDENT, ROLES.RECRUITER];

export const PRIVILEGED_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.COLLEGE_ADMIN,
  ROLES.FACULTY,
  ROLES.COMPANY_ADMIN
];

/**
 * Normalizes legacy or variant role strings to canonical role values.
 */
export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return ROLES.STUDENT;
  const r = role.toLowerCase().trim();
  if (r === 'candidate' || r === 'student') return ROLES.STUDENT;
  if (r === 'admin' || r === 'super_admin' || r === 'superadmin') return ROLES.SUPER_ADMIN;
  if (r === 'recruiter') return ROLES.RECRUITER;
  if (r === 'college_admin' || r === 'collegeadmin') return ROLES.COLLEGE_ADMIN;
  if (r === 'faculty') return ROLES.FACULTY;
  if (r === 'company_admin' || r === 'companyadmin') return ROLES.COMPANY_ADMIN;
  return r;
}

export function isValidCanonicalRole(role) {
  return CANONICAL_ROLES.includes(normalizeRole(role));
}

export function isPublicSignupRole(role) {
  const norm = normalizeRole(role);
  return PUBLIC_SIGNUP_ROLES.includes(norm);
}
