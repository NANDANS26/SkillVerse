// Backend/tests/phase13_ai_recommendations.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { submitAttempt } from '../src/controllers/assessments.controller.js';
import {
  setGoal,
  getRoadmap,
  regenerateRoadmap,
  updateRecommendation
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

describe('SkillVerse Phase 13: Evidence-Aware AI Learning Recommendation Engine Suite', () => {
  const timestamp = Date.now();
  let student1User;
  let candidate1Id;
  let student2User;
  let candidate2Id;
  let targetRecId;

  before(async () => {
    // 1. Create Student 1
    const { req: s1Req, res: s1Res } = createMockReqRes({
      body: {
        name: `Phase13 Student1 ${timestamp}`,
        email: `phase13_s1_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(s1Req, s1Res);
    assert.equal(s1Res.statusCode, 201);
    student1User = s1Res.body.user;

    const { req: c1Req, res: c1Res } = createMockReqRes({
      user: student1User,
      body: {
        headline: 'Distributed Systems & Cloud Engineer Apprentice',
        skills: ['Rust', 'Distributed Systems'],
        experience_years: 1.0,
        resume_text: 'Building async microservices in Rust.'
      }
    });
    await createCandidate(c1Req, c1Res);
    candidate1Id = c1Res.body.candidate_id;

    // 2. Create Student 2 (for tenant isolation test)
    const { req: s2Req, res: s2Res } = createMockReqRes({
      body: {
        name: `Phase13 Student2 ${timestamp}`,
        email: `phase13_s2_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(s2Req, s2Res);
    assert.equal(s2Res.statusCode, 201);
    student2User = s2Res.body.user;

    const { req: c2Req, res: c2Res } = createMockReqRes({
      user: student2User,
      body: {
        headline: 'Full-Stack Developer',
        skills: ['React', 'Python'],
        experience_years: 1.0,
        resume_text: 'Full stack React and Python developer.'
      }
    });
    await createCandidate(c2Req, c2Res);
    candidate2Id = c2Res.body.candidate_id;

    // 3. Candidate 1 submits failed benchmark attempt in Rust to trigger development_indicated gap
    const { req: asmReq, res: asmRes } = createMockReqRes({
      user: student1User,
      params: { slug: 'rust-systems-foundations' },
      body: { answers: { q1: 'wrong', q2: 'wrong', q3: 'wrong', q4: 'wrong', q5: 'wrong' } }
    });
    await submitAttempt(asmReq, asmRes);
  });

  describe('1. Model-Assisted Recommendation Generation & Architecture', () => {
    it('should generate roadmap with v2.0.0-ai-semantic-recommendation engine', async () => {
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
      assert.ok(res.body.roadmap);
      assert.equal(res.body.roadmap.engine_version, 'v2.0.0-ai-semantic-recommendation');
      assert.ok(Array.isArray(res.body.roadmap.recommendations));
      assert.ok(res.body.roadmap.recommendations.length > 0);
    });

    it('should attach rich recommendation_metadata with semantic similarity and explanation factors', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getRoadmap(req, res);

      assert.equal(res.statusCode, 200);
      const recs = res.body.recommendations;
      assert.ok(recs.length > 0);

      // Find an AI-recommended activity
      const aiRec = recs.find(r => r.recommendation_metadata?.is_ai_recommended === true);
      assert.ok(aiRec, 'At least one recommendation must have is_ai_recommended=true');

      const meta = aiRec.recommendation_metadata;
      assert.ok(typeof meta.ranking_score === 'number');
      assert.ok(meta.ranking_score >= 0.0 && meta.ranking_score <= 1.0);
      assert.ok(typeof meta.semantic_similarity === 'number');
      assert.ok(meta.semantic_similarity >= 0.0 && meta.semantic_similarity <= 1.0);
      assert.equal(meta.model_version, 'all-MiniLM-L6-v2');

      // Scoring breakdown
      assert.ok(meta.scoring_breakdown);
      assert.ok(meta.scoring_breakdown.weights);
      assert.equal(meta.scoring_breakdown.weights.semantic_similarity, 0.40);
      assert.equal(meta.scoring_breakdown.weights.gap_urgency, 0.30);

      // Grounded explanation
      assert.ok(meta.explanation);
      assert.ok(meta.explanation.primary_driver);
      assert.ok(meta.explanation.rationale_text);
      assert.ok(typeof meta.explanation.semantic_relevance_pct === 'number');

      targetRecId = aiRec.id;
    });

    it('should maintain strict priority order ascending across recommendations', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getRoadmap(req, res);

      const recs = res.body.recommendations;
      for (let i = 0; i < recs.length - 1; i++) {
        assert.ok(
          recs[i].priority <= recs[i + 1].priority,
          `Priority must be ascending: rec[${i}].priority (${recs[i].priority}) <= rec[${i+1}].priority (${recs[i+1].priority})`
        );
      }
    });
  });

  describe('2. Recommendation Lifecycle & Metadata Preservation', () => {
    it('should preserve recommendation_metadata across status transitions (in_progress -> completed)', async () => {
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
          completion_metadata: { notes: 'Completed review of Rust RAII and ownership patterns.' }
        }
      });
      await updateRecommendation(cReq, cRes);
      assert.equal(cRes.statusCode, 200);
      assert.equal(cRes.body.recommendation.status, 'completed');
      assert.ok(cRes.body.recommendation.completed_at);

      // 3. Verify recommendation_metadata is intact in DB
      const { rows } = await db.query(
        `SELECT recommendation_metadata FROM roadmap_recommendations WHERE id = $1`,
        [targetRecId]
      );
      assert.ok(rows[0]);
      assert.equal(rows[0].recommendation_metadata.is_ai_recommended, true);
      assert.equal(rows[0].recommendation_metadata.model_version, 'all-MiniLM-L6-v2');
    });

    it('IDEMPOTENCY: regeneration preserves existing statuses and does not duplicate keys', async () => {
      const { req: r1Req, res: r1Res } = createMockReqRes({ user: student1User });
      await regenerateRoadmap(r1Req, r1Res);
      const count1 = r1Res.body.recommendations.length;

      const { req: r2Req, res: r2Res } = createMockReqRes({ user: student1User });
      await regenerateRoadmap(r2Req, r2Res);
      const count2 = r2Res.body.recommendations.length;

      assert.equal(count1, count2);

      // The completed item should STILL have status completed
      const compItem = r2Res.body.recommendations.find(r => r.id === targetRecId);
      assert.ok(compItem);
      assert.equal(compItem.status, 'completed');
    });
  });

  describe('3. Multi-Tenant Authorization & Security', () => {
    it('SECURITY: Student 2 cannot modify Student 1 recommendation (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: student2User,
        params: { id: targetRecId },
        body: { status: 'dismissed' }
      });
      await updateRecommendation(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
    });
  });
});
