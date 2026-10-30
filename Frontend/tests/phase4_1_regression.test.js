// Frontend/tests/phase4_1_regression.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 4.1: Post-Implementation Regression Audit & API Preservation', () => {
  const FRONTEND_PAGES_DIR = path.resolve('src/pages');

  it('verifies ProfileBuilder.tsx wires the real candidate profile endpoint with valid schema', () => {
    const profileBuilderPath = path.join(FRONTEND_PAGES_DIR, 'ProfileBuilder.tsx');
    assert.ok(fs.existsSync(profileBuilderPath), 'ProfileBuilder.tsx must exist');
    const content = fs.readFileSync(profileBuilderPath, 'utf-8');

    // Wires /candidates or /candidates/me via typed api service
    assert.ok(content.includes("api.post('/candidates'"), 'Must post to /candidates');
    assert.ok(content.includes("api.get('/candidates/me')"), 'Must prefill from /candidates/me');
    
    // Verifies schema matches Backend expectations
    assert.ok(content.includes('full_name:'), 'Must include full_name in payload');
    assert.ok(content.includes('headline:'), 'Must include headline in payload');
    assert.ok(content.includes('experience_years:'), 'Must include experience_years in payload');
    assert.ok(content.includes('skill_json:'), 'Must include skill_json in payload');
    assert.ok(content.includes('resume_text:'), 'Must include resume_text in payload');

    // Verifies demo mode support
    assert.ok(content.includes('isDemoMode'), 'Must respect isDemoMode');
  });

  it('verifies CreateJob.tsx wires live job creation and labels JD parser fallback preview', () => {
    const createJobPath = path.join(FRONTEND_PAGES_DIR, 'recruiter/CreateJob.tsx');
    assert.ok(fs.existsSync(createJobPath), 'CreateJob.tsx must exist');
    const content = fs.readFileSync(createJobPath, 'utf-8');

    // Live job creation via api service
    assert.ok(content.includes("api.post('/jobs'"), 'Must post to /jobs');
    assert.ok(content.includes('title:'), 'Must send title');
    assert.ok(content.includes('location:'), 'Must send location');
    assert.ok(content.includes('required_skills:'), 'Must send required_skills');
    assert.ok(content.includes('experience_min:'), 'Must send experience_min');
    assert.ok(content.includes('experience_max:'), 'Must send experience_max');

    // Verifies AI JD parser honesty label when offline
    assert.ok(
      content.includes('Simulated AI Parser Preview') || content.includes('Demonstration Model'),
      'Must honestly label simulated AI JD parser preview fallback'
    );
  });

  it('verifies JobListings.tsx integrates with GET /jobs and handles demo vs real states', () => {
    const jobListingsPath = path.join(FRONTEND_PAGES_DIR, 'recruiter/JobListings.tsx');
    assert.ok(fs.existsSync(jobListingsPath), 'JobListings.tsx must exist');
    const content = fs.readFileSync(jobListingsPath, 'utf-8');

    // Real API integration
    assert.ok(content.includes("api.get('/jobs')"), 'Must query GET /jobs via api service');
    assert.ok(content.includes('isDemoMode'), 'Must support demo mode');
    assert.ok(
      content.includes('(Simulated Requisitions — Demo Mode)') || content.includes('Demo Mode'),
      'Must clearly label simulated demo requisitions'
    );
    assert.ok(content.includes('/recruiter/job/'), 'Must link to job details and matches');
  });

  it('verifies CandidateMatches.tsx handles 503, 403, and genuine 0 matches distinctly', () => {
    const candidateMatchesPath = path.join(FRONTEND_PAGES_DIR, 'recruiter/CandidateMatches.tsx');
    assert.ok(fs.existsSync(candidateMatchesPath), 'CandidateMatches.tsx must exist');
    const content = fs.readFileSync(candidateMatchesPath, 'utf-8');

    // API integration
    assert.ok(content.includes("api.get(`/jobs/${id}/matches`)") || content.includes('/matches'), 'Must fetch matches for job id');

    // Error differentiation
    assert.ok(content.includes('503'), 'Must handle HTTP 503 service unavailable');
    assert.ok(content.includes('403'), 'Must handle HTTP 403 permission denied');
    assert.ok(
      content.includes('No Candidate Matches Found (0 Results)') || content.includes('0 Results'),
      'Must distinguish genuine 0 matches from service errors'
    );

    // Honesty badge for demo mode
    assert.ok(
      content.includes('Simulated Candidate Matches') || content.includes('Demo Benchmark'),
      'Must honestly label simulated candidate matches'
    );
  });

  it('verifies all role dashboards contain honest telemetry and demonstration badges', () => {
    const dashboards = [
      { name: 'candidate/CandidateDashboard.tsx', token: 'Sample Skill DNA' },
      { name: 'college/CollegeAdminDashboard.tsx', token: 'Sample Cohort Telemetry' },
      { name: 'faculty/FacultyDashboard.tsx', token: 'Sample Mentorship Telemetry' },
      { name: 'company/CompanyAdminDashboard.tsx', token: 'Simulated Enterprise Telemetry' },
      { name: 'recruiter/RecruiterDashboard.tsx', token: 'Simulated Pipeline Telemetry' },
      { name: 'Admin.tsx', token: 'Telemetry Monitor' }
    ];

    for (const d of dashboards) {
      const fullPath = path.join(FRONTEND_PAGES_DIR, d.name);
      assert.ok(fs.existsSync(fullPath), `${d.name} must exist`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(
        content.includes(d.token) || content.includes('Demonstration') || content.includes('Simulated'),
        `${d.name} must contain honest demo/benchmark telemetry disclosure`
      );
    }
  });

  it('verifies layout integrity: pages do not mount redundant <Sidebar /> inside AppShell', () => {
    const auditedPages = [
      'candidate/CandidateDashboard.tsx',
      'candidate/CandidateJobs.tsx',
      'candidate/CandidateAchievements.tsx',
      'candidate/CandidateApplications.tsx',
      'candidate/CandidateLearning.tsx',
      'recruiter/RecruiterDashboard.tsx',
      'recruiter/JobListings.tsx',
      'recruiter/CreateJob.tsx',
      'recruiter/CandidateMatches.tsx',
      'recruiter/Matches.tsx',
      'recruiter/Candidates.tsx',
      'recruiter/Analytics.tsx',
      'Admin.tsx'
    ];

    for (const pageRel of auditedPages) {
      const fullPath = path.join(FRONTEND_PAGES_DIR, pageRel);
      assert.ok(fs.existsSync(fullPath), `${pageRel} must exist`);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Make sure there is NO active <Sidebar /> element in JSX
      const hasActiveSidebarJsx = /<Sidebar\s*\/>/.test(content);
      assert.strictEqual(
        hasActiveSidebarJsx,
        false,
        `${pageRel} must NOT render <Sidebar /> because AppShell already provides it`
      );
    }
  });
});
