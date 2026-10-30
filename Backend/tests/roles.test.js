// Backend/tests/roles.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLES,
  CANONICAL_ROLES,
  PUBLIC_SIGNUP_ROLES,
  PRIVILEGED_ROLES,
  normalizeRole,
  isValidCanonicalRole,
  isPublicSignupRole
} from '../src/constants/roles.js';

describe('Canonical Role Model & Security Policies', () => {
  it('defines exactly the 6 canonical platform roles', () => {
    assert.deepEqual(CANONICAL_ROLES.sort(), [
      'college_admin',
      'company_admin',
      'faculty',
      'recruiter',
      'student',
      'super_admin'
    ]);
  });

  it('correctly maps legacy role "candidate" to canonical "student"', () => {
    assert.equal(normalizeRole('candidate'), ROLES.STUDENT);
    assert.equal(normalizeRole('Candidate'), ROLES.STUDENT);
    assert.equal(normalizeRole('CANDIDATE '), ROLES.STUDENT);
  });

  it('correctly maps legacy role "admin" to canonical "super_admin"', () => {
    assert.equal(normalizeRole('admin'), ROLES.SUPER_ADMIN);
    assert.equal(normalizeRole('Admin'), ROLES.SUPER_ADMIN);
    assert.equal(normalizeRole('superadmin'), ROLES.SUPER_ADMIN);
  });

  it('preserves valid canonical role names', () => {
    assert.equal(normalizeRole('student'), ROLES.STUDENT);
    assert.equal(normalizeRole('recruiter'), ROLES.RECRUITER);
    assert.equal(normalizeRole('college_admin'), ROLES.COLLEGE_ADMIN);
    assert.equal(normalizeRole('faculty'), ROLES.FACULTY);
    assert.equal(normalizeRole('company_admin'), ROLES.COMPANY_ADMIN);
    assert.equal(normalizeRole('super_admin'), ROLES.SUPER_ADMIN);
  });

  it('allows public self-signup ONLY for student and recruiter', () => {
    assert.equal(isPublicSignupRole('student'), true);
    assert.equal(isPublicSignupRole('candidate'), true); // mapped to student
    assert.equal(isPublicSignupRole('recruiter'), true);

    // Privileged roles MUST NOT be publicly registerable
    assert.equal(isPublicSignupRole('super_admin'), false);
    assert.equal(isPublicSignupRole('admin'), false);
    assert.equal(isPublicSignupRole('college_admin'), false);
    assert.equal(isPublicSignupRole('faculty'), false);
    assert.equal(isPublicSignupRole('company_admin'), false);
  });

  it('properly identifies valid canonical roles', () => {
    assert.equal(isValidCanonicalRole('student'), true);
    assert.equal(isValidCanonicalRole('recruiter'), true);
    assert.equal(isValidCanonicalRole('super_admin'), true);
    assert.equal(isValidCanonicalRole('unknown_role'), false);
  });
});
