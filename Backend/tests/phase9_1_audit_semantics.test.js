// Backend/tests/phase9_1_audit_semantics.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { submitAttempt } from '../src/controllers/assessments.controller.js';
import {
  getGoal,
  setGoal,
  getRoadmap,
  regenerateRoadmap,
  updateRecommendation
} from '../src/controllers/roadmap.controller.js';
import {
  analyzeSkillGaps,
  generateDevelopmentRoadmap,
  ROADMAP_ENGINE_VERSION
} from '../src/services/roadmap.service.js';

function createMockReqRes(options = {}) {
  const req = {
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user || null,
    params: options.params || {},
    query: options.query || {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { value: val, options: opts };
      return this;
    },
    clearCookie(name, opts) {
      delete this.cookies[name];
      return this;
    }
  };

  return { req, res };
}

describe('SkillVerse Phase 9.1: Independent Roadmap, Readiness-Score & Semantics Audit', () => {
  const timestamp = Date.now();
  let studentUser;
  let candidateId;
  let inactiveJobId;
  let activeJobId;

  before(async () => {
    // Create audit test student
    const { req: sReq, res: sRes } = createMockReqRes({
      body: {
        email: `phase9_1_auditor_${timestamp}@skillverse.test`,
        password: 'Password123!',
        name: 'Phase 9.1 Auditor',
        role: 'student'
      }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    const { req: cpReq, res: cpRes } = createMockReqRes({
      user: studentUser,
      body: {
        headline: 'Audit Test Candidate',
        experience_years: 2.0,
        skill_json: ['Rust', 'Python'], // Self-reported only
        resume_text: 'Experienced systems and backend engineer.'
      }
    });
    await createCandidate(cpReq, cpRes);
    candidateId = cpRes.body.candidate_id;

    // Seed test jobs: one active and one closed/inactive
    const { rows: actJob } = await db.query(
      `INSERT INTO jobs (recruiter_id, title, location, raw_text, parsed_json, status)
       VALUES ($1, 'Active Architect Position', 'Remote', 'Active job with rust and postgres.', $2, 'active')
       RETURNING id`,
      [studentUser.id, JSON.stringify({ skills: ['Rust', 'PostgreSQL'] })]
    );
    activeJobId = actJob[0].id;

    const { rows: inactJob } = await db.query(
      `INSERT INTO jobs (recruiter_id, title, location, raw_text, parsed_json, status)
       VALUES ($1, 'Draft / Closed Position', 'Internal', 'Draft requisition.', $2, 'closed')
       RETURNING id`,
      [studentUser.id, JSON.stringify({ skills: ['Rust', 'Docker'] })]
    );
    inactiveJobId = inactJob[0].id;
  });

  describe('A. Target Requirement Normalization & Deduplication', () => {
    it('NORMALIZATION: handles aliases, case variations, whitespace, and multiple aliases for same canonical skill', async () => {
      // Pass a noisy target skill list:
      // 'PostgreSQL', 'postgres', 'psql' -> all map to canonical skill id 5 (PostgreSQL)
      // '  DOCKER  ' -> maps to docker (id 7)
      // 'k8s' -> alias for kubernetes (id 8)
      // '' and null -> empty/malformed
      // 'Spring Boot', 'Spring Boot' -> unknown/unresolved, repeated
      const noisySkills = [
        'PostgreSQL',
        'postgres',
        'psql',
        '  DOCKER  ',
        'k8s',
        '',
        null,
        'Spring Boot',
        'Spring Boot'
      ];

      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          goal_type: 'target_role',
          target_title: 'Custom Architect Goal',
          target_skills: noisySkills
        }
      });
      await setGoal(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);

      // Verify that target_skills in DB has empty values removed
      const savedGoal = res.body.goal;
      const parsedSaved = typeof savedGoal.target_skills === 'string'
        ? JSON.parse(savedGoal.target_skills)
        : savedGoal.target_skills;
      assert.ok(!parsedSaved.includes(''));
      assert.ok(!parsedSaved.includes(null));

      // Retrieve roadmap
      const { req: rReq, res: rRes } = createMockReqRes({ user: studentUser });
      await getRoadmap(rReq, rRes);

      assert.equal(rRes.statusCode, 200);
      const gaps = rRes.body.gaps;

      // Unique canonical skills: postgresql, docker, kubernetes (3) + 1 unresolved (Spring Boot) = 4 total
      assert.equal(gaps.length, 4, 'must have exactly 4 unique target gaps without duplicate rows');

      const pgGap = gaps.find(g => g.skill_slug === 'postgresql');
      assert.ok(pgGap, 'postgresql must be present');
      assert.ok(pgGap.aliases_requested.includes('postgres'), 'postgres alias must be recorded');
      assert.ok(pgGap.aliases_requested.includes('psql'), 'psql alias must be recorded');

      const springGap = gaps.find(g => g.target_requirement === 'Spring Boot');
      assert.ok(springGap, 'Spring Boot must be preserved as unresolved');
      assert.equal(springGap.gap_state, 'requirement_unresolved');
    });

    it('SECURITY: rejects setting target goal to an inactive, closed, or draft job', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          goal_type: 'target_job',
          target_job_id: inactiveJobId
        }
      });
      await setGoal(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('not an active open requisition'));
    });
  });

  describe('B. Readiness Score Semantics & Insufficient Evidence State', () => {
    it('SEMANTICS: surfaces insufficient_evidence state when candidate has 0 benchmark evidence', async () => {
      // Candidate has self-reported 'Rust' and 'Python', but NO passing benchmark attempts
      const { req, res } = createMockReqRes({ user: studentUser });
      await getRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      const summary = res.body.summary;

      // Self-reported claims must NOT count as supported
      assert.equal(summary.supported_count, 0, 'self-reported skills must not count as supported');
      assert.equal(summary.is_insufficient_evidence, true, 'must flag insufficient evidence when 0 benchmarks taken');
      assert.equal(summary.sufficiency_status, 'insufficient_evidence');
      assert.ok(summary.score_label.includes('Insufficient Assessment Evidence'));
      assert.ok(summary.disclaimer.includes('Transparent heuristic coverage indicator'));
    });

    it('SEMANTICS: passing standardized benchmark converts skill to supported and computes empirical readiness score', async () => {
      // Student takes and passes Rust benchmark assessment (100%)
      const { req: asmReq, res: asmRes } = createMockReqRes({
        user: studentUser,
        params: { slug: 'rust-systems-foundations' },
        body: { answers: { q1: 'b', q2: 'a', q3: 'b', q4: 'b', q5: 'b' } }
      });
      await submitAttempt(asmReq, asmRes);
      assert.equal(asmRes.statusCode, 201);
      assert.equal(asmRes.body.passed, true);

      // Set goal targeting Rust (canonical) and Go (canonical)
      const { req: gReq, res: gRes } = createMockReqRes({
        user: studentUser,
        body: {
          goal_type: 'target_role',
          target_title: 'Systems Specialist',
          target_skills: ['Rust', 'Go']
        }
      });
      await setGoal(gReq, gRes);
      assert.equal(gRes.statusCode, 201);

      const summary = gRes.body.roadmap.summary;
      assert.equal(summary.total_target_skills, 2);
      assert.equal(summary.supported_count, 1); // Rust is supported
      assert.equal(summary.unassessed_count, 1); // Go is unassessed
      assert.equal(summary.readiness_score, 50.0);
      assert.equal(summary.is_insufficient_evidence, false);
      assert.equal(summary.sufficiency_status, 'computed');
      assert.equal(summary.score_label, '50%');
    });

    it('SEMANTICS: unresolved job requirements dilute readiness score rather than inflating it', async () => {
      // Set goal targeting Rust (supported) + NonExistentSkillZ (unresolved)
      const { req: gReq, res: gRes } = createMockReqRes({
        user: studentUser,
        body: {
          goal_type: 'target_role',
          target_title: 'Mixed Goal',
          target_skills: ['Rust', 'NonExistentSkillZ']
        }
      });
      await setGoal(gReq, gRes);
      assert.equal(gRes.statusCode, 201);

      const summary = gRes.body.roadmap.summary;
      assert.equal(summary.total_target_skills, 2);
      assert.equal(summary.supported_count, 1);
      assert.equal(summary.unresolved_count, 1);
      assert.equal(summary.readiness_score, 50.0, 'unresolved skill must count in denominator and reduce score');
    });
  });

  describe('C. Recommendation Idempotency & Lifecycle Preservation', () => {
    let recId;

    it('LIFECYCLE: maintains in_progress and completed status across roadmap regenerations', async () => {
      // 1. Get current recommendations
      const { req: rReq, res: rRes } = createMockReqRes({ user: studentUser });
      await getRoadmap(rReq, rRes);
      assert.ok(rRes.body.recommendations.length > 0);

      recId = rRes.body.recommendations[0].id;

      // 2. Mark recommendation in_progress
      const { req: pReq, res: pRes } = createMockReqRes({
        user: studentUser,
        params: { id: recId },
        body: { status: 'in_progress' }
      });
      await updateRecommendation(pReq, pRes);
      assert.equal(pRes.statusCode, 200);
      assert.equal(pRes.body.recommendation.status, 'in_progress');

      // 3. Regenerate roadmap
      const { req: regReq, res: regRes } = createMockReqRes({ user: studentUser });
      await regenerateRoadmap(regReq, regRes);
      assert.equal(regRes.statusCode, 200);

      // Verify recommendation is STILL in_progress (status was not wiped out!)
      const refreshedRec = regRes.body.recommendations.find(r => r.id === recId);
      assert.ok(refreshedRec, 'recommendation must exist');
      assert.equal(refreshedRec.status, 'in_progress', 'status must remain in_progress across regeneration');

      // 4. Mark recommendation completed
      const { req: cReq, res: cRes } = createMockReqRes({
        user: studentUser,
        params: { id: recId },
        body: { status: 'completed' }
      });
      await updateRecommendation(cReq, cRes);
      assert.equal(cRes.statusCode, 200);
      assert.equal(cRes.body.recommendation.status, 'completed');

      // 5. Regenerate roadmap again
      const { req: regReq2, res: regRes2 } = createMockReqRes({ user: studentUser });
      await regenerateRoadmap(regReq2, regRes2);
      assert.equal(regRes2.statusCode, 200);

      const refreshedRec2 = regRes2.body.recommendations.find(r => r.id === recId);
      assert.ok(refreshedRec2);
      assert.equal(refreshedRec2.status, 'completed', 'status must remain completed across regeneration');
    });

    it('LIFECYCLE: rejects invalid lifecycle transitions with 400 Bad Request', async () => {
      // Attempt invalid transition: completed -> dismissed
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { id: recId },
        body: { status: 'dismissed' }
      });
      await updateRecommendation(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Invalid status transition'));
    });

    it('IDEMPOTENCY: records engine version in development_roadmaps snapshot', async () => {
      const { req, res } = createMockReqRes({ user: studentUser });
      await getRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(
        res.body.engine_version === 'v1.1.0-deterministic-roadmap' || res.body.engine_version === ROADMAP_ENGINE_VERSION,
        `Expected engine_version to match roadmap version, got ${res.body.engine_version}`
      );
    });
  });
});
