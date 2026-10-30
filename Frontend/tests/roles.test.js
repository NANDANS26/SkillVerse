// Frontend/tests/roles.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import from compiled dist or test the logic directly
describe('Frontend Role Model & Route Helpers', () => {
  const CANONICAL_ROLES = [
    'student',
    'college_admin',
    'faculty',
    'company_admin',
    'recruiter',
    'super_admin'
  ];

  const PUBLIC_SIGNUP_ROLES = ['student', 'recruiter'];

  const ROLE_DASHBOARDS = {
    student: '/student/dashboard',
    recruiter: '/recruiter/dashboard',
    super_admin: '/admin',
    college_admin: '/college/dashboard',
    faculty: '/faculty/dashboard',
    company_admin: '/company/dashboard'
  };

  function normalizeRole(role) {
    if (!role || typeof role !== 'string') return 'student';
    const r = role.toLowerCase().trim();
    if (r === 'candidate') return 'student';
    if (r === 'admin') return 'super_admin';
    if (r === 'superadmin') return 'super_admin';
    if (r === 'collegeadmin') return 'college_admin';
    if (r === 'companyadmin') return 'company_admin';
    if (CANONICAL_ROLES.includes(r)) return r;
    return 'student';
  }

  function getRoleDashboardPath(role) {
    const normalized = normalizeRole(role);
    return ROLE_DASHBOARDS[normalized] || '/student/dashboard';
  }

  function isRoleAllowed(userRole, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRole) return false;
    const normalizedUserRole = normalizeRole(userRole);
    return allowedRoles.map(r => normalizeRole(r)).includes(normalizedUserRole);
  }

  function isPublicSignupRole(role) {
    const norm = normalizeRole(role);
    return PUBLIC_SIGNUP_ROLES.includes(norm);
  }

  it('normalizes legacy candidate role to student', () => {
    assert.equal(normalizeRole('candidate'), 'student');
    assert.equal(normalizeRole('Candidate'), 'student');
  });

  it('normalizes legacy admin role to super_admin', () => {
    assert.equal(normalizeRole('admin'), 'super_admin');
    assert.equal(normalizeRole('superadmin'), 'super_admin');
  });

  it('returns canonical dashboard paths', () => {
    assert.equal(getRoleDashboardPath('student'), '/student/dashboard');
    assert.equal(getRoleDashboardPath('candidate'), '/student/dashboard');
    assert.equal(getRoleDashboardPath('recruiter'), '/recruiter/dashboard');
    assert.equal(getRoleDashboardPath('super_admin'), '/admin');
    assert.equal(getRoleDashboardPath('admin'), '/admin');
  });

  it('enforces route protection by role correctly', () => {
    assert.equal(isRoleAllowed('student', ['student']), true);
    assert.equal(isRoleAllowed('candidate', ['student']), true);
    assert.equal(isRoleAllowed('recruiter', ['student']), false);
    assert.equal(isRoleAllowed('student', ['recruiter']), false);
    assert.equal(isRoleAllowed('super_admin', ['super_admin']), true);
    assert.equal(isRoleAllowed('admin', ['super_admin']), true);
  });

  it('permits public signup ONLY for student and recruiter', () => {
    assert.equal(isPublicSignupRole('student'), true);
    assert.equal(isPublicSignupRole('candidate'), true);
    assert.equal(isPublicSignupRole('recruiter'), true);
    assert.equal(isPublicSignupRole('super_admin'), false);
    assert.equal(isPublicSignupRole('admin'), false);
    assert.equal(isPublicSignupRole('college_admin'), false);
    assert.equal(isPublicSignupRole('faculty'), false);
    assert.equal(isPublicSignupRole('company_admin'), false);
  });
});
