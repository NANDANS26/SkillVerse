// Backend/tests/phase9_personalized_roadmaps.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { submitEvidence, reviewEvidence } from '../src/controllers/skills.controller.js';
import { submitAttempt } from '../src/controllers/assessments.controller.js';
import {
  getGoal,
  setGoal,
  getRoadmap,
  regenerateRoadmap,
  updateRecommendation,
  listActivities
} from '../src/controllers/roadmap.controller.js';
import { ROADMAP_ENGINE_VERSION } from '../src/services/roadmap.service.js';

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

describe('SkillVerse Phase 9: Personalized Skill Gap Analysis & Development Roadmaps Suite', () => {
  const timestamp = Date.now();
  let student1User;
  let candidate1Id;
  let student2User;
  let candidate2Id;
  let facultyUser;
  let persistedJobId;
  let targetRecId;

  before(async () => {
    // 1. Create Student 1
    const { req: sReq1, res: sRes1 } = createMockReqRes({
      body: {
        email: `phase9_student1_${timestamp}@skillverse.test`,
        password: 'Password123!',
        name: 'Phase9 Student One',
        role: 'student'
      }
    });
    await signup(sReq1, sRes1);
    student1User = sRes1.body.user;

    const { req: cpReq1, res: cpRes1 } = createMockReqRes({
      user: student1User,
      body: {
        headline: 'Distributed Systems Aspirant',
        experience_years: 1.5,
        skill_json: ['Rust'],
        resume_text: 'Building low-latency network applications.'
      }
    });
    await createCandidate(cpReq1, cpRes1);
    candidate1Id = cpRes1.body.candidate_id;

    // 2. Create Student 2 (for authorization checks)
    const { req: sReq2, res: sRes2 } = createMockReqRes({
      body: {
        email: `phase9_student2_${timestamp}@skillverse.test`,
        password: 'Password123!',
        name: 'Phase9 Student Two',
        role: 'student'
      }
    });
    await signup(sReq2, sRes2);
    student2User = sRes2.body.user;

    const { req: cpReq2, res: cpRes2 } = createMockReqRes({
      user: student2User,
      body: {
        headline: 'Frontend Specialist',
        experience_years: 2.0,
        skill_json: ['React'],
        resume_text: 'UI and React developer.'
      }
    });
    await createCandidate(cpReq2, cpRes2);
    candidate2Id = cpRes2.body.candidate_id;

    // 3. Create Faculty User
    const { rows: fRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      ['Prof. Hopper', `phase9_faculty_${timestamp}@apex.edu`]
    );
    facultyUser = fRows[0];

    // 4. Create an active persisted recruiter job for target job testing
    const { rows: jobRows } = await db.query(
      `INSERT INTO jobs (recruiter_id, title, location, raw_text, parsed_json, status)
       VALUES ($1, 'Senior Rust & Cloud Engineer', 'Remote, US', 'Looking for Senior Rust and Cloud Engineer with distributed systems.', $2, 'active')
       RETURNING id`,
      [facultyUser.id, JSON.stringify({ skills: ['Rust', 'Distributed Systems', 'Docker', 'NonStandardSkillX'] })]
    );
    persistedJobId = jobRows[0].id;
  });

  describe('1. Learning Activities Catalogue', () => {
    it('should retrieve seeded learning and practice activities from PostgreSQL', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await listActivities(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.activities));
      assert.ok(res.body.activities.length >= 10);

      // Verify presence of benchmark assessments and practice projects
      const hasAssessment = res.body.activities.some(a => a.activity_type === 'assessment');
      const hasProject = res.body.activities.some(a => a.activity_type === 'practice_project');
      assert.ok(hasAssessment, 'catalogue must contain assessment activities');
      assert.ok(hasProject, 'catalogue must contain practice project activities');
    });

    it('should filter activities by canonical skill slug', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        query: { skill: 'rust' }
      });
      await listActivities(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(res.body.activities.every(a => a.skill_slug === 'rust'));
    });
  });

  describe('2. Student Goal Setting & Persistence', () => {
    it('should report no active goal when none has been configured', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getGoal(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.has_goal, false);
      assert.equal(res.body.goal, null);
      assert.ok(Array.isArray(res.body.career_presets));
      assert.ok(Array.isArray(res.body.available_jobs));
    });

    it('should set an active career role goal and persist target skills', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          goal_type: 'target_role',
          target_title: 'Distributed Systems & Cloud Engineer',
          target_skills: ['distributed-systems', 'rust', 'docker', 'postgresql']
        }
      });
      await setGoal(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.goal.id);
      assert.equal(res.body.goal.target_title, 'Distributed Systems & Cloud Engineer');
      assert.equal(res.body.goal.status, 'active');

      // Verify roadmap was automatically generated
      assert.ok(res.body.roadmap);
      assert.equal(res.body.roadmap.engine_version, ROADMAP_ENGINE_VERSION);
    });

    it('should retrieve the persisted active goal', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getGoal(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.has_goal, true);
      assert.equal(res.body.goal.target_title, 'Distributed Systems & Cloud Engineer');
    });
  });

  describe('3. Explainable Skill Gap Analysis', () => {
    before(async () => {
      // Setup candidate 1 evidence:
      // a) Rust: Candidate passes Rust benchmark assessment with 100% (Evidence Supports Target)
      const { req: asmReq, res: asmRes } = createMockReqRes({
        user: student1User,
        params: { slug: 'rust-systems-foundations' },
        body: { answers: { q1: 'b', q2: 'a', q3: 'b', q4: 'b', q5: 'b' } }
      });
      await submitAttempt(asmReq, asmRes);

      // b) Distributed Systems: Candidate fails assessment attempt with 0% (Development Indicated)
      const { req: fReq, res: fRes } = createMockReqRes({
        user: student1User,
        params: { slug: 'distributed-systems-consensus' },
        body: { answers: { q1: 'wrong', q2: 'wrong', q3: 'wrong', q4: 'wrong', q5: 'wrong' } }
      });
      await submitAttempt(fReq, fRes);

      // c) Docker: Candidate submits project evidence (Evidence Pending Review)
      const { req: pReq, res: pRes } = createMockReqRes({
        user: student1User,
        body: {
          skill_slug: 'docker',
          source_type: 'project_submission',
          title: 'Distroless Multi-Stage Container',
          source_reference: 'https://github.com/skillverse-test/distroless-app'
        }
      });
      await submitEvidence(pReq, pRes);

      // d) PostgreSQL remains Unassessed
    });

    it('should classify each target skill into its truthful, explainable gap state', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await regenerateRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.has_goal, true);
      assert.ok(Array.isArray(res.body.gaps));

      // 1. Rust must be evidence_supports_target
      const rustGap = res.body.gaps.find(g => g.skill_slug === 'rust');
      assert.ok(rustGap, 'rust must be evaluated in gaps');
      assert.equal(rustGap.gap_state, 'evidence_supports_target');
      assert.ok(rustGap.evidence_considered.includes('Passed standardized benchmark'));
      assert.equal(rustGap.missing_elements.length, 0);

      // 2. Distributed Systems must be development_indicated
      const dsGap = res.body.gaps.find(g => g.skill_slug === 'distributed-systems');
      assert.ok(dsGap, 'distributed-systems must be evaluated in gaps');
      assert.equal(dsGap.gap_state, 'development_indicated');
      assert.ok(dsGap.evidence_considered.includes('below pass threshold'));
      assert.ok(dsGap.actionable_next_step.includes('retake'));

      // 3. Docker must be evidence_pending
      const dockerGap = res.body.gaps.find(g => g.skill_slug === 'docker');
      assert.ok(dockerGap, 'docker must be evaluated in gaps');
      assert.equal(dockerGap.gap_state, 'evidence_pending');
      assert.ok(dockerGap.missing_elements.some(m => m.includes('faculty')));

      // 4. PostgreSQL must be unassessed
      const pgGap = res.body.gaps.find(g => g.skill_slug === 'postgresql');
      assert.ok(pgGap, 'postgresql must be evaluated in gaps');
      assert.equal(pgGap.gap_state, 'unassessed');
      assert.ok(pgGap.rationale.includes('unassessed opportunity, not a proven weakness'));

      // Verify Summary counts
      assert.equal(res.body.summary.supported_count, 1);
      assert.equal(res.body.summary.development_needed_count, 1);
      assert.equal(res.body.summary.pending_count, 1);
      assert.equal(res.body.summary.unassessed_count, 1);
    });

    it('should derive requirements from a persisted job and classify unknown skills as requirement_unresolved', async () => {
      // Set goal to the persisted job created in before hook (which includes NonStandardSkillX)
      const { req: setReq, res: setRes } = createMockReqRes({
        user: student1User,
        body: {
          goal_type: 'target_job',
          target_job_id: persistedJobId
        }
      });
      await setGoal(setReq, setRes);
      assert.equal(setRes.statusCode, 201);

      const { req, res } = createMockReqRes({ user: student1User });
      await getRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.goal.goal_type, 'target_job');

      // NonStandardSkillX must be requirement_unresolved
      const unmappedGap = res.body.gaps.find(g => g.target_requirement === 'NonStandardSkillX');
      assert.ok(unmappedGap, 'NonStandardSkillX must be captured');
      assert.equal(unmappedGap.gap_state, 'requirement_unresolved');
      assert.equal(unmappedGap.skill_id, null);
    });
  });

  describe('4. Deterministic Recommendation Engine & Lifecycle', () => {
    it('should generate prioritized recommendations with documented urgency', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.recommendations));
      assert.ok(res.body.recommendations.length > 0);

      // Verify recommendations are sorted by priority ascending
      for (let i = 0; i < res.body.recommendations.length - 1; i++) {
        assert.ok(
          res.body.recommendations[i].priority <= res.body.recommendations[i + 1].priority,
          'recommendations must be ordered by priority ascending'
        );
      }

      // Priority 1 must exist for development_indicated skill (distributed-systems)
      const devRec = res.body.recommendations.find(r => r.priority === 1);
      assert.ok(devRec, 'must have Priority 1 recommendation for development indicated');
      assert.equal(devRec.recommendation_type, 'retake_assessment');

      targetRecId = devRec.id;
    });

    it('should transition recommendation status from active -> in_progress -> completed', async () => {
      // 1. Mark in_progress
      const { req: pReq, res: pRes } = createMockReqRes({
        user: student1User,
        params: { id: targetRecId },
        body: { status: 'in_progress' }
      });
      await updateRecommendation(pReq, pRes);
      assert.equal(pRes.statusCode, 200);
      assert.equal(pRes.body.recommendation.status, 'in_progress');

      // 2. Mark completed
      const { req: cReq, res: cRes } = createMockReqRes({
        user: student1User,
        params: { id: targetRecId },
        body: {
          status: 'completed',
          completion_metadata: { notes: 'Completed review of Paxos invariant proofs.' }
        }
      });
      await updateRecommendation(cReq, cRes);
      assert.equal(cRes.statusCode, 200);
      assert.equal(cRes.body.recommendation.status, 'completed');
      assert.ok(cRes.body.recommendation.completed_at);
    });

    it('INTEGRITY: marking a recommendation completed does NOT forge verified Skill DNA or alter scores', async () => {
      // Re-fetch roadmap gaps
      const { req, res } = createMockReqRes({ user: student1User });
      await getRoadmap(req, res);

      // Distributed Systems should STILL be development_indicated in Skill DNA because no passing assessment was taken!
      const dsGap = res.body.gaps.find(g => g.skill_slug === 'distributed-systems');
      assert.ok(dsGap);
      assert.equal(dsGap.gap_state, 'development_indicated');
      assert.equal(dsGap.verification_status, 'unverified');
    });

    it('IDEMPOTENCY: repeated generation requests do not produce unbounded duplicate recommendations', async () => {
      const { req: r1Req, res: r1Res } = createMockReqRes({ user: student1User });
      await regenerateRoadmap(r1Req, r1Res);
      const count1 = r1Res.body.recommendations.length;

      const { req: r2Req, res: r2Res } = createMockReqRes({ user: student1User });
      await regenerateRoadmap(r2Req, r2Res);
      const count2 = r2Res.body.recommendations.length;

      assert.equal(count1, count2, 'regeneration must be idempotent without creating duplicate active records');
    });
  });

  describe('5. Role Authorization & Cross-Tenant Data Isolation', () => {
    it('SECURITY: Student 2 cannot update or access Student 1 recommendations (403 Forbidden)', async () => {
      // Student 2 tries to update Student 1's recommendation
      const { req, res } = createMockReqRes({
        user: student2User,
        params: { id: targetRecId },
        body: { status: 'completed' }
      });
      await updateRecommendation(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
    });

    it('SECURITY: Changing target goal re-evaluates roadmap for current candidate only without leaking state', async () => {
      // Student 2 sets their own goal
      const { req: s2Req, res: s2Res } = createMockReqRes({
        user: student2User,
        body: {
          goal_type: 'target_role',
          target_title: 'Full-Stack Web & Cloud Developer',
          target_skills: ['react', 'python', 'fastapi']
        }
      });
      await setGoal(s2Req, s2Res);
      assert.equal(s2Res.statusCode, 201);

      // Student 1's goal must remain unaffected
      const { req: s1Req, res: s1Res } = createMockReqRes({ user: student1User });
      await getGoal(s1Req, s1Res);
      assert.equal(s1Res.body.goal.goal_type, 'target_job');
      assert.equal(s1Res.body.goal.candidate_id, candidate1Id);
    });
  });
});
