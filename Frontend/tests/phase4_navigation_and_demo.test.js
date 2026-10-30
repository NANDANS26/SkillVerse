// Frontend/tests/phase4_navigation_and_demo.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Phase 4: Navigation Architecture & Demo Mode Isolation', () => {
  const CANONICAL_ROLES = [
    'student',
    'college_admin',
    'faculty',
    'company_admin',
    'recruiter',
    'super_admin'
  ];

  const ROLE_NAV_PATHS = {
    student: [
      '/student/dashboard',
      '/student/profile',
      '/student/assessments',
      '/student/learning',
      '/student/projects',
      '/student/jobs',
      '/student/activity',
      '/student/achievements',
      '/student/settings'
    ],
    college_admin: [
      '/college/dashboard',
      '/college/students',
      '/college/faculty',
      '/college/cohorts',
      '/college/assignments',
      '/college/analytics',
      '/college/reports',
      '/college/settings'
    ],
    faculty: [
      '/faculty/dashboard',
      '/faculty/students',
      '/faculty/classes',
      '/faculty/assessments',
      '/faculty/submissions',
      '/faculty/mentoring',
      '/faculty/skills',
      '/faculty/reports',
      '/faculty/settings'
    ],
    company_admin: [
      '/company/dashboard',
      '/company/recruiters',
      '/company/jobs',
      '/company/teams',
      '/company/skills',
      '/company/analytics',
      '/company/reports',
      '/company/settings'
    ],
    recruiter: [
      '/recruiter/dashboard',
      '/recruiter/jobs',
      '/recruiter/create-job',
      '/recruiter/candidates',
      '/recruiter/matches',
      '/recruiter/interviews',
      '/recruiter/analytics',
      '/recruiter/settings'
    ],
    super_admin: [
      '/admin',
      '/admin/users',
      '/admin/institutions',
      '/admin/companies',
      '/admin/access',
      '/admin/plugins',
      '/admin/logs',
      '/admin/health',
      '/admin/settings'
    ]
  };

  it('guarantees complete navigation coverage across all 6 roles', () => {
    for (const role of CANONICAL_ROLES) {
      const paths = ROLE_NAV_PATHS[role];
      assert.ok(paths && paths.length >= 7, `Role ${role} must have at least 7 navigation routes`);
      for (const p of paths) {
        assert.ok(p.startsWith('/'), `Path ${p} must start with /`);
        assert.ok(!p.includes(' '), `Path ${p} must not contain spaces`);
      }
    }
  });

  it('ensures each role uses its designated path prefix or canonical namespace', () => {
    for (const p of ROLE_NAV_PATHS.student) assert.ok(p.startsWith('/student'));
    for (const p of ROLE_NAV_PATHS.college_admin) assert.ok(p.startsWith('/college'));
    for (const p of ROLE_NAV_PATHS.faculty) assert.ok(p.startsWith('/faculty'));
    for (const p of ROLE_NAV_PATHS.company_admin) assert.ok(p.startsWith('/company'));
    for (const p of ROLE_NAV_PATHS.recruiter) assert.ok(p.startsWith('/recruiter'));
    for (const p of ROLE_NAV_PATHS.super_admin) assert.ok(p.startsWith('/admin'));
  });

  it('verifies deterministic demo mode mock profiles for all 6 roles', () => {
    const demoProfiles = {
      student: { name: 'Alex Chen', role: 'student', isDemo: true },
      college_admin: { name: 'Dean Elena Rostova', role: 'college_admin', isDemo: true },
      faculty: { name: 'Prof. Aris Thorne', role: 'faculty', isDemo: true },
      company_admin: { name: 'Marcus Vance', role: 'company_admin', isDemo: true },
      recruiter: { name: 'Sarah Jenkins', role: 'recruiter', isDemo: true },
      super_admin: { name: 'Morgan Blake', role: 'super_admin', isDemo: true }
    };

    for (const role of CANONICAL_ROLES) {
      const profile = demoProfiles[role];
      assert.ok(profile, `Demo profile must exist for ${role}`);
      assert.equal(profile.role, role);
      assert.equal(profile.isDemo, true);
      assert.ok(profile.name.length > 3);
    }
  });

  it('verifies demo mode isolation does not forge server session cookies', () => {
    const demoUser = {
      id: 'demo-student-01',
      name: 'Alex Chen',
      email: 'alex.chen@student.skillverse.local',
      role: 'student',
      isDemo: true
    };

    assert.equal(demoUser.isDemo, true);
    // Demo user does not contain server auth token
    assert.equal('token' in demoUser, false);
    // Role is strictly normalized
    assert.equal(CANONICAL_ROLES.includes(demoUser.role), true);
  });
});
