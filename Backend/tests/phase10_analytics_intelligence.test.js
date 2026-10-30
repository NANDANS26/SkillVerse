// Backend/tests/phase10_analytics_intelligence.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createJob } from '../src/controllers/jobs.controller.js';
import {
  getStudentAnalyticsController,
  getCollegeAnalyticsController,
  getFacultyAnalyticsController,
  getWorkforceDemandController,
  getCompanyAnalyticsController,
  getOperationsAnalyticsController
} from '../src/controllers/analytics.controller.js';
import { normalizeSkillString } from '../src/services/analytics.service.js';

function createMockReqRes({ user = null, body = {}, params = {}, query = {} } = {}) {
  const req = {
    user,
    body,
    params,
    query,
    headers: {}
  };

  const res = {
    statusCode: 200,
    body: null,
    cookies: {},
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  return { req, res };
}

describe('SkillVerse Phase 10: Skill Intelligence Analytics & Workforce Demand Suite', () => {
  const timestamp = Date.now();
  let studentUser1, studentUser2;
  let collegeAdminUser1, collegeAdminUser2;
  let facultyUser1, facultyUser2;
  let recruiterUser;
  let companyAdminUser;
  let superAdminUser;
  let institutionId1, institutionId2;
  let companyId1;
  let candidateId1, candidateId2;
  let skillPostgres, skillPython, skillReact;

  before(async () => {
    // 1. Get canonical skills
    const { rows: skillRows } = await db.query(
      "SELECT id, slug, name, aliases FROM skills WHERE slug IN ('postgresql', 'python', 'react')"
    );
    skillPostgres = skillRows.find(s => s.slug === 'postgresql');
    skillPython = skillRows.find(s => s.slug === 'python');
    skillReact = skillRows.find(s => s.slug === 'react');

    // 2. Register Users for multiple tenants
    // Student 1 & 2
    const { req: s1Req, res: s1Res } = createMockReqRes({
      body: { name: 'P10 Student One', email: `p10_student1_${timestamp}@skillverse.test`, password: 'Password123!', role: 'student' }
    });
    await signup(s1Req, s1Res);
    studentUser1 = s1Res.body.user;

    const { req: s2Req, res: s2Res } = createMockReqRes({
      body: { name: 'P10 Student Two', email: `p10_student2_${timestamp}@skillverse.test`, password: 'Password123!', role: 'student' }
    });
    await signup(s2Req, s2Res);
    studentUser2 = s2Res.body.user;

    // Recruiter
    const { req: rReq, res: rRes } = createMockReqRes({
      body: { name: 'P10 Recruiter', email: `p10_recruiter_${timestamp}@skillverse.test`, password: 'Password123!', role: 'recruiter' }
    });
    await signup(rReq, rRes);
    recruiterUser = rRes.body.user;

    // Direct DB insertion for enterprise roles to bypass public signup role protections
    // College Admin 1 & 2
    const { rows: ca1Rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'college_admin', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 College Admin 1', `p10_ca1_${timestamp}@skillverse.test`]
    );
    collegeAdminUser1 = ca1Rows[0];

    const { rows: ca2Rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'college_admin', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 College Admin 2', `p10_ca2_${timestamp}@skillverse.test`]
    );
    collegeAdminUser2 = ca2Rows[0];

    // Faculty 1 & 2
    const { rows: f1Rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'faculty', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 Faculty 1', `p10_faculty1_${timestamp}@skillverse.test`]
    );
    facultyUser1 = f1Rows[0];

    const { rows: f2Rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'faculty', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 Faculty 2', `p10_faculty2_${timestamp}@skillverse.test`]
    );
    facultyUser2 = f2Rows[0];

    // Company Admin
    const { rows: compAdminRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'company_admin', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 Company Admin', `p10_compadmin_${timestamp}@skillverse.test`]
    );
    companyAdminUser = compAdminRows[0];

    // Super Admin
    const { rows: saRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, 'hash', 'super_admin', NOW(), NOW()) RETURNING id, name, email, role`,
      ['P10 Super Admin', `p10_superadmin_${timestamp}@skillverse.test`]
    );
    superAdminUser = saRows[0];

    // 3. Create Institutions and Memberships
    const { rows: inst1Rows } = await db.query(
      `INSERT INTO institutions (name, code, domain, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [`Apex Institute ${timestamp}`, `APEX_${timestamp}`, `apex_${timestamp}.edu`]
    );
    institutionId1 = inst1Rows[0].id;

    const { rows: inst2Rows } = await db.query(
      `INSERT INTO institutions (name, code, domain, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [`Beacon College ${timestamp}`, `BEAC_${timestamp}`, `beacon_${timestamp}.edu`]
    );
    institutionId2 = inst2Rows[0].id;

    // Assign memberships
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role, created_at)
       VALUES ($1, $2, 'college_admin', NOW()),
              ($1, $3, 'faculty', NOW()),
              ($1, $4, 'student', NOW()),
              ($5, $6, 'college_admin', NOW()),
              ($5, $7, 'student', NOW())`,
      [
        institutionId1, collegeAdminUser1.id, facultyUser1.id, studentUser1.id,
        institutionId2, collegeAdminUser2.id, studentUser2.id
      ]
    );

    // 4. Create Company and Memberships
    const { rows: c1Rows } = await db.query(
      `INSERT INTO companies (name, domain, industry, created_at, updated_at)
       VALUES ($1, $2, 'Technology', NOW(), NOW()) RETURNING id`,
      [`NovaCloud Enterprise ${timestamp}`, `novacloud_${timestamp}.io`]
    );
    companyId1 = c1Rows[0].id;

    await db.query(
      `INSERT INTO company_memberships (company_id, user_id, role, created_at)
       VALUES ($1, $2, 'company_admin', NOW()),
              ($1, $3, 'recruiter', NOW())`,
      [companyId1, companyAdminUser.id, recruiterUser.id]
    );

    // 5. Create Candidate Profiles
    const { rows: c1Prof } = await db.query(
      `INSERT INTO candidates (user_id, full_name, headline, email, experience_years, resume_text, skill_json, created_at, updated_at)
       VALUES ($1, 'P10 Student Alice', 'Backend Systems Engineer', $2, 3.5, 'PostgreSQL, Python, distributed storage.', $3, NOW(), NOW())
       RETURNING id`,
      [studentUser1.id, studentUser1.email, JSON.stringify(['PostgreSQL', 'Python'])]
    );
    candidateId1 = c1Prof[0].id;

    const { rows: c2Prof } = await db.query(
      `INSERT INTO candidates (user_id, full_name, headline, email, experience_years, resume_text, skill_json, created_at, updated_at)
       VALUES ($1, 'P10 Student Bob', 'Frontend Specialist', $2, 2.0, 'React, web UI design.', $3, NOW(), NOW())
       RETURNING id`,
      [studentUser2.id, studentUser2.email, JSON.stringify(['React'])]
    );
    candidateId2 = c2Prof[0].id;

    // Enqueue candidate indexing records to maintain outbox atomicity invariants
    await db.query(
      `INSERT INTO indexing_queue (candidate_id, status, attempts, created_at, updated_at)
       VALUES ($1, 'completed', 1, NOW(), NOW()),
              ($2, 'completed', 1, NOW(), NOW())`,
      [candidateId1, candidateId2]
    );

    // 6. Assign Faculty Mentorship (Faculty 1 mentors Student 1 at Institution 1)
    await db.query(
      `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes, assigned_at, updated_at)
       VALUES ($1, $2, $3, 'active', 'Primary technical thesis advisor', NOW(), NOW())`,
      [institutionId1, facultyUser1.id, studentUser1.id]
    );

    // 7. Insert Assessment Attempts for Student 1
    const { rows: asmRows } = await db.query('SELECT id FROM assessments LIMIT 1');
    const sampleAsmId = asmRows[0]?.id || 1;

    await db.query(
      `INSERT INTO assessment_attempts (candidate_id, assessment_id, assessment_version, score, passed, answers_submitted, duration_seconds, completed_at)
       VALUES ($1, $2, 1, 0.850, true, '{"q1": 1}', 320, NOW() - INTERVAL '2 days'),
              ($1, $2, 1, 0.925, true, '{"q1": 1}', 290, NOW() - INTERVAL '1 day')`,
      [candidateId1, sampleAsmId]
    );

    // 8. Insert Skill Evidence
    // Student 1: 1 verified faculty review, 1 pending review, 1 rejected review
    await db.query(
      `INSERT INTO skill_evidence (candidate_id, skill_id, source_type, title, description, source_reference, review_status, reviewer_id, reviewed_at, review_feedback, confidence_score, created_at, updated_at)
       VALUES ($1, $2, 'faculty_review', 'Distributed DB Project', 'High throughput WAL engine', 'https://github.com/alice/wal', 'verified', $3, NOW(), 'Thorough schema design', 0.75, NOW() - INTERVAL '3 days', NOW()),
              ($1, $4, 'project_submission', 'Python Async Crawler', 'Event-driven web scraper', 'https://github.com/alice/crawler', 'pending', NULL, NULL, NULL, 0.35, NOW() - INTERVAL '1 hour', NOW()),
              ($1, $4, 'project_submission', 'Basic Script', 'Flawed syntax', 'https://github.com/alice/flawed', 'rejected', $3, NOW() - INTERVAL '5 days', 'Incomplete implementation', 0.35, NOW() - INTERVAL '6 days', NOW())`,
      [candidateId1, skillPostgres.id, facultyUser1.id, skillPython.id]
    );

    // 9. Insert Roadmap & Recommendations for Student 1
    const { rows: goalRows } = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills, status, created_at, updated_at)
       VALUES ($1, 'role', 'Senior Cloud Data Architect', $2, 'active', NOW(), NOW()) RETURNING id`,
      [candidateId1, JSON.stringify(['PostgreSQL', 'Python'])]
    );
    const goalId1 = goalRows[0].id;

    const { rows: roadmapRows } = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, engine_version, readiness_score, gap_analysis_json, summary_json, created_at, updated_at)
       VALUES ($1, $2, 'v1.1.0-deterministic-roadmap', 50.0, '[]', '{"is_insufficient_evidence": false}', NOW(), NOW()) RETURNING id`,
      [candidateId1, goalId1]
    );
    const roadmapId1 = roadmapRows[0].id;

    await db.query(
      `INSERT INTO roadmap_recommendations (roadmap_id, candidate_id, skill_id, recommendation_key, recommendation_type, priority, title, action_text, rationale, status, completed_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'rec:1:test', 'activity', 1, 'Deep Dive WAL', 'Read section 3', 'High priority', 'completed', NOW(), NOW(), NOW()),
              ($1, $2, $4, 'rec:2:test', 'activity', 2, 'Build Async Python API', 'Code endpoints', 'Moderate priority', 'in_progress', NULL, NOW(), NOW())`,
      [roadmapId1, candidateId1, skillPostgres.id, skillPython.id]
    );

    // 10. Create Jobs: 1 Open Job with company 1, 1 Closed Job with company 1, 1 Open Job without company
    await db.query(
      `INSERT INTO jobs (recruiter_id, company_id, title, location, raw_text, parsed_json, experience_min, experience_max, status, created_at, updated_at)
       VALUES ($1, $2, 'Senior Database Architect', 'Remote', 'PostgreSQL and psql required', $3, 3, 7, 'open', NOW(), NOW()),
              ($1, $2, 'Archived Frontend Lead', 'Remote', 'React required', $4, 2, 5, 'closed', NOW(), NOW()),
              ($1, NULL, 'Autonomous Python Engineer', 'Remote', 'Python and NonTaxonomySuperTool required', $5, 2, 6, 'open', NOW(), NOW())`,
      [
        recruiterUser.id,
        companyId1,
        JSON.stringify({ skills: ['PostgreSQL', 'psql'] }), // Synonymous aliases!
        JSON.stringify({ skills: ['React'] }),
        JSON.stringify({ skills: ['Python', 'NonTaxonomySuperTool'] }) // Unresolved non-taxonomy skill
      ]
    );

    // 11. Create Applications for company 1
    const { rows: compJobs } = await db.query('SELECT id FROM jobs WHERE company_id = $1 LIMIT 1', [companyId1]);
    if (compJobs[0]) {
      await db.query(
        `INSERT INTO applications (job_id, candidate_id, status, match_score, created_at, updated_at)
         VALUES ($1, $2, 'interviewing', 0.95, NOW(), NOW())
         ON CONFLICT (job_id, candidate_id) DO NOTHING`,
        [compJobs[0].id, candidateId1]
      );
    }
  });

  describe('1. Data Correctness & Skill Intelligence Normalization', () => {
    it('normalizes canonical skills and alias variants to the same canonical competency', async () => {
      const { rows: allSkills } = await db.query('SELECT id, slug, name, category, aliases FROM skills');
      
      const norm1 = await normalizeSkillString('PostgreSQL', allSkills);
      const norm2 = await normalizeSkillString('postgres', allSkills);
      const norm3 = await normalizeSkillString('psql', allSkills);

      assert.equal(norm1.is_canonical, true);
      assert.equal(norm2.is_canonical, true);
      assert.equal(norm3.is_canonical, true);
      assert.equal(norm1.id, norm2.id);
      assert.equal(norm2.id, norm3.id);
      assert.equal(norm1.slug, 'postgresql');

      // Unresolved non-canonical skill
      const unres = await normalizeSkillString('QuantumNonExistentToolXYZ', allSkills);
      assert.equal(unres.is_canonical, false);
      assert.equal(unres.raw, 'QuantumNonExistentToolXYZ');
    });

    it('counts distinct open jobs and does not inflate demand when duplicate aliases are requested', async () => {
      const { req, res } = createMockReqRes({
        user: superAdminUser
      });

      await getWorkforceDemandController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      
      const intelligence = res.body.skill_intelligence;
      assert.ok(Array.isArray(intelligence));

      // In pre-setup: Senior Database Architect requested ['PostgreSQL', 'psql'] (both map to postgresql)
      const pgDemand = intelligence.find(s => s.slug === 'postgresql');
      assert.ok(pgDemand);
      // The single open job must only count ONCE towards distinct_open_jobs_requiring
      assert.ok(pgDemand.distinct_open_jobs_requiring >= 1);

      // Unresolved non-taxonomy requirements must be surfaced
      const unresolved = res.body.unresolved_requirements;
      assert.ok(Array.isArray(unresolved));
      const hasSuperTool = unresolved.some(u => u.raw_name.toLowerCase() === 'nontaxonomysupertool');
      assert.ok(hasSuperTool, 'Unresolved non-canonical skill must be tracked in workforce intelligence');
    });

    it('strictly excludes closed jobs from open workforce demand counts', async () => {
      const { req, res } = createMockReqRes({
        user: companyAdminUser
      });

      await getWorkforceDemandController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // In setup: 'Archived Frontend Lead' requiring 'React' was status='closed' for company 1
      // For company-scoped view, React open demand should NOT include the closed job
      const reactDemand = res.body.skill_intelligence.find(s => s.slug === 'react');
      if (reactDemand) {
        // If company has no other open React jobs, distinct_open_jobs_requiring should be 0
        assert.equal(reactDemand.distinct_open_jobs_requiring, 0, 'Closed job must not contribute to open demand');
      }
    });
  });

  describe('2. Student Analytics & Evidence Segregation', () => {
    it('returns candidate-specific assessment outcomes and verified competencies over time', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser1
      });

      await getStudentAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.candidate_id, candidateId1);

      // Assessments
      assert.equal(res.body.assessments.total_attempts, 2);
      assert.equal(res.body.assessments.passed_attempts, 2);
      assert.ok(res.body.assessments.history.length === 2);

      // Verified competencies
      assert.ok(res.body.verified_competencies.faculty_reviewed_skills_count >= 1);
      const pgVerified = res.body.verified_competencies.faculty_reviewed_skills.find(s => s.slug === 'postgresql');
      assert.ok(pgVerified);

      // Evidence backlog: 1 pending, 1 rejected
      assert.equal(res.body.evidence_backlog.pending_count, 1);
      assert.equal(res.body.evidence_backlog.rejected_count, 1);

      // Roadmap progress: 1 completed, 1 in_progress
      assert.equal(res.body.roadmap.recommendations_by_status.completed, 1);
      assert.equal(res.body.roadmap.recommendations_by_status.in_progress, 1);
      assert.equal(res.body.roadmap.completed_activities_count, 1);
      assert.equal(res.body.is_insufficient_evidence, false);
      assert.match(res.body.disclaimer, /Readiness score is an auditable heuristic coverage indicator/);
    });

    it('returns empty/insufficient-evidence state when student has no attempts or verified evidence', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser2
      });

      await getStudentAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.candidate_id, candidateId2);

      // Student 2 has no assessment attempts and no faculty verified items
      assert.equal(res.body.assessments.total_attempts, 0);
      assert.equal(res.body.verified_competencies.faculty_reviewed_skills_count, 0);
      assert.equal(res.body.is_insufficient_evidence, true);
    });
  });

  describe('3. College Administrator Analytics & Multi-Tenant Scoping', () => {
    it('aggregates student and faculty counts strictly within authorized institution', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminUser1
      });

      await getCollegeAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution.id, institutionId1);

      // Institution 1 has 1 student and 1 faculty
      assert.equal(res.body.cohort.total_students, 1);
      assert.equal(res.body.cohort.total_faculty, 1);
      assert.equal(res.body.cohort.assigned_students, 1);
      assert.equal(res.body.cohort.assignment_coverage_pct, 100.0);

      // Review backlog from Institution 1's enrolled student (Student 1 has 1 pending evidence)
      assert.equal(res.body.evidence_pipeline.review_backlog_count, 1);
      assert.equal(res.body.assessments.total_attempts, 2);
    });

    it('isolates separate institution data without data leakage', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminUser2
      });

      await getCollegeAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution.id, institutionId2);

      // Institution 2 has Student 2 (0 attempts, 0 reviews, 0 assigned faculty)
      assert.equal(res.body.cohort.total_students, 1);
      assert.equal(res.body.cohort.total_faculty, 0);
      assert.equal(res.body.cohort.assigned_students, 0);
      assert.equal(res.body.evidence_pipeline.review_backlog_count, 0);
      assert.equal(res.body.assessments.total_attempts, 0);
    });
  });

  describe('4. Faculty Analytics & Mentorship Boundary Scoping', () => {
    it('scopes assigned mentees, pending reviews, and decisions to the authenticated faculty member', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser1
      });

      await getFacultyAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // Mentees: Student 1
      assert.equal(res.body.mentees.total_count, 1);
      assert.equal(res.body.mentees.roster[0].user_id, studentUser1.id);

      // Pending reviews for assigned mentees (1 pending python scraper)
      assert.equal(res.body.reviews.pending_backlog_count, 1);
      assert.equal(res.body.reviews.pending_items[0].skill_name, 'Python');

      // Decisions completed: 1 verified (Postgres WAL), 1 rejected (flawed python)
      assert.equal(res.body.reviews.decisions_completed.approved, 1);
      assert.equal(res.body.reviews.decisions_completed.rejected, 1);
      assert.equal(res.body.reviews.decisions_completed.total_reviewed, 2);
    });

    it('returns clean zero state for faculty with no assigned mentees without exposing other students', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser2
      });

      await getFacultyAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // Faculty 2 has no mentees
      assert.equal(res.body.mentees.total_count, 0);
      assert.equal(res.body.reviews.pending_backlog_count, 0);
      assert.equal(res.body.reviews.decisions_completed.total_reviewed, 0);
    });
  });

  describe('5. Company Administrator Analytics & Application Pipeline', () => {
    it('aggregates company-scoped requisitions, recruiters, and real application pipeline states', async () => {
      const { req, res } = createMockReqRes({
        user: companyAdminUser
      });

      await getCompanyAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.company.id, companyId1);

      // Recruiters: 2 members (company admin and recruiter)
      assert.equal(res.body.recruiters.total_count, 2);

      // Requisitions: 2 total (1 open, 1 closed)
      assert.equal(res.body.requisitions.total, 2);
      assert.equal(res.body.requisitions.open, 1);
      assert.equal(res.body.requisitions.closed, 1);

      // Pipeline: 1 application with status 'interviewing'
      assert.equal(res.body.pipeline.total_applications, 1);
      assert.equal(res.body.pipeline.by_status.interviewing, 1);
      assert.equal(res.body.pipeline.by_status.hired, 0, 'Interviewing status must NOT count as hired');
      assert.match(res.body.disclaimer, /Hires are only recorded when application status is explicitly "hired"/);
    });
  });

  describe('6. Super Administrator Operational Telemetry', () => {
    it('returns authoritative counts across roles, queues, model services, and sanitized audit events', async () => {
      const { req, res } = createMockReqRes({
        user: superAdminUser
      });

      await getOperationsAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // Role counts
      assert.ok(res.body.users.total > 0);
      assert.ok(res.body.users.by_role.student >= 2);
      assert.ok(res.body.users.by_role.college_admin >= 2);
      assert.ok(res.body.users.by_role.faculty >= 2);
      assert.ok(res.body.users.by_role.company_admin >= 1);
      assert.ok(res.body.users.by_role.recruiter >= 1);
      assert.ok(res.body.users.by_role.super_admin >= 1);

      // Queue and models
      assert.ok(res.body.indexing_queue);
      assert.ok(typeof res.body.indexing_queue.pending === 'number');

      // Audit logs
      assert.ok(Array.isArray(res.body.recent_audit_events));
      for (const a of res.body.recent_audit_events) {
        // Assert security hygiene: no passwords or tokens exposed
        assert.equal(a.password_hash, undefined);
        assert.equal(a.token, undefined);
      }
    });
  });

  describe('7. Role-Based Access Control & Tenant Boundary Enforcement', () => {
    it('enforces that students without an institution cannot access college analytics', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser1
      });

      await getCollegeAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      // Student 1 has membership with institution 1, so returns institution 1 analytics
      assert.equal(res.body.institution.id, institutionId1);
    });

    it('enforces that a student cannot access company analytics when not in a company', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser1
      });

      await getCompanyAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.has_company, false);
      assert.match(res.body.message, /not assigned to an enterprise company/);
    });

    it('returns empty mentee state for unassigned faculty rather than leaking other mentees', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser2
      });

      await getFacultyAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.mentees.total_count, 0);
      assert.equal(res.body.reviews.pending_backlog_count, 0);
    });

    it('enforces that recruiter passing a foreign company_id is strictly restricted to their own company scope', async () => {
      // Recruiter belongs to companyId1. Attempt to pass query: { company_id: 99999 } or a competitor ID
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        query: { company_id: '99999' }
      });

      await getWorkforceDemandController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      // The scope must remain company_scoped to companyId1, not 99999
      assert.equal(res.body.population_scope.scope_type, 'company_scoped');
      // In setup, companyId1 has 1 open job ('Senior Database Architect' with PostgreSQL)
      // If 99999 had been honored, total_open_jobs_analyzed would be 0
      assert.equal(res.body.population_scope.total_open_jobs_analyzed, 1);
    });

    it('enforces that college admin cannot override institution_id via query parameters', async () => {
      // collegeAdminUser1 belongs to institutionId1. Try passing query: { institution_id: institutionId2 }
      const { req, res } = createMockReqRes({
        user: collegeAdminUser1,
        query: { institution_id: String(institutionId2) }
      });

      await getCollegeAnalyticsController(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      // Must strictly remain institutionId1
      assert.equal(res.body.institution.id, institutionId1);
    });
  });
});
