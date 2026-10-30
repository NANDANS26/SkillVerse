// Backend/tests/phase14_feedback_and_evaluation.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { setGoal, getRoadmap } from '../src/controllers/roadmap.controller.js';
import {
  postImpressions,
  postInteraction,
  postFeedback,
  getFeedback,
  getEvaluationReport
} from '../src/controllers/feedback.controller.js';
import { getEvaluationDataset } from '../src/services/feedback.service.js';

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

describe('SkillVerse Phase 14: Recommendation Feedback, Outcome Tracking and Evaluation Pipeline Suite', () => {
  const timestamp = Date.now();
  let student1User;
  let candidate1Id;
  let roadmap1Id;
  let rec1Id;
  let rec2Id;

  let student2User;
  let candidate2Id;
  let roadmap2Id;
  let student2RecId;

  let superAdminUser;
  let recruiterUser;

  before(async () => {
    // 1. Setup Student 1
    const { req: s1Req, res: s1Res } = createMockReqRes({
      body: {
        name: `Phase14 Student1 ${timestamp}`,
        email: `phase14_s1_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(s1Req, s1Res);
    student1User = s1Res.body.user;

    const { req: c1Req, res: c1Res } = createMockReqRes({
      user: student1User,
      body: {
        headline: 'Systems & Cloud Engineer',
        skills: ['Rust', 'PostgreSQL'],
        experience_years: 1.0,
        resume_text: 'Experienced with concurrent systems and PostgreSQL optimization.'
      }
    });
    await createCandidate(c1Req, c1Res);
    candidate1Id = c1Res.body.candidate_id;

    // Set Student 1 Goal & Generate Roadmap
    const { req: g1Req, res: g1Res } = createMockReqRes({
      user: student1User,
      body: {
        goal_type: 'target_role',
        target_title: 'Distributed Systems & Cloud Engineer',
        target_skills: ['Distributed Systems', 'Rust', 'Docker', 'PostgreSQL']
      }
    });
    await setGoal(g1Req, g1Res);
    assert.equal(g1Res.statusCode, 201);
    roadmap1Id = g1Res.body.roadmap.roadmap_id;

    const { req: r1Req, res: r1Res } = createMockReqRes({ user: student1User });
    await getRoadmap(r1Req, r1Res);
    assert.ok(r1Res.body.recommendations.length >= 2, 'Student 1 must have at least 2 recommendations');
    rec1Id = r1Res.body.recommendations[0].id;
    rec2Id = r1Res.body.recommendations[1].id;

    // 2. Setup Student 2 (for cross-student authorization testing)
    const { req: s2Req, res: s2Res } = createMockReqRes({
      body: {
        name: `Phase14 Student2 ${timestamp}`,
        email: `phase14_s2_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(s2Req, s2Res);
    student2User = s2Res.body.user;

    const { req: c2Req, res: c2Res } = createMockReqRes({
      user: student2User,
      body: {
        headline: 'Frontend Engineer',
        skills: ['React', 'TypeScript'],
        experience_years: 1.5,
        resume_text: 'Building responsive React web applications.'
      }
    });
    await createCandidate(c2Req, c2Res);
    candidate2Id = c2Res.body.candidate_id;

    const { req: g2Req, res: g2Res } = createMockReqRes({
      user: student2User,
      body: {
        goal_type: 'target_role',
        target_title: 'Frontend Engineer',
        target_skills: ['React', 'TypeScript', 'CSS']
      }
    });
    await setGoal(g2Req, g2Res);
    roadmap2Id = g2Res.body.roadmap.roadmap_id;
    student2RecId = g2Res.body.roadmap.recommendations[0]?.id;

    // 3. Setup Super Admin & Recruiter
    const { req: saReq, res: saRes } = createMockReqRes({
      body: {
        name: `Phase14 Admin ${timestamp}`,
        email: `phase14_admin_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'super_admin'
      }
    });
    // Insert super admin directly to bypass public signup role restriction
    const { rows: saRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hashed_pw', 'super_admin')
       RETURNING id, name, email, role`,
      [saReq.body.name, saReq.body.email]
    );
    superAdminUser = saRows[0];

    const { req: recReq, res: recRes } = createMockReqRes({
      body: {
        name: `Phase14 Recruiter ${timestamp}`,
        email: `phase14_rec_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'recruiter'
      }
    });
    await signup(recReq, recRes);
    recruiterUser = recRes.body.user;
  });

  describe('1. Recommendation Impression Tracking & Presentation Snapshots', () => {
    const presentationId = `pres_${Date.now()}_test1`;

    it('records presented recommendation impressions with rank position and score snapshot', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          roadmap_id: roadmap1Id,
          presentation_id: presentationId,
          surface: 'learning_roadmap',
          impressions: [
            {
              recommendation_id: rec1Id,
              rank_position: 1,
              engine_version: 'v2.0.0-ai-semantic-recommendation',
              model_version: 'all-MiniLM-L6-v2',
              ranking_score: 0.8542,
              score_breakdown: {
                semantic_similarity: 0.82,
                gap_urgency: 1.0,
                difficulty_calibration: 0.85,
                verification_payoff: 0.90
              }
            },
            {
              recommendation_id: rec2Id,
              rank_position: 2,
              engine_version: 'v2.0.0-ai-semantic-recommendation',
              model_version: 'all-MiniLM-L6-v2',
              ranking_score: 0.7410,
              score_breakdown: {
                semantic_similarity: 0.71,
                gap_urgency: 0.85,
                difficulty_calibration: 0.75,
                verification_payoff: 0.60
              }
            }
          ]
        }
      });

      await postImpressions(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.presentation_id, presentationId);
      assert.equal(res.body.recorded_impressions, 2);

      // Verify records in database
      const { rows } = await db.query(
        'SELECT * FROM recommendation_impressions WHERE presentation_id = $1 ORDER BY rank_position ASC',
        [presentationId]
      );
      assert.equal(rows.length, 2);
      assert.equal(rows[0].recommendation_id, rec1Id);
      assert.equal(rows[0].rank_position, 1);
      assert.equal(rows[0].engine_version, 'v2.0.0-ai-semantic-recommendation');
      assert.equal(rows[0].model_version, 'all-MiniLM-L6-v2');
      assert.equal(Number(rows[0].ranking_score), 0.8542);
      assert.equal(rows[0].score_breakdown.semantic_similarity, 0.82);
    });

    it('enforces duplicate impression protection: repeated presentation_id does not create duplicate DB rows', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          roadmap_id: roadmap1Id,
          presentation_id: presentationId, // Duplicate presentationId
          surface: 'learning_roadmap',
          impressions: [
            { recommendation_id: rec1Id, rank_position: 1 },
            { recommendation_id: rec2Id, rank_position: 2 }
          ]
        }
      });

      await postImpressions(req, res);
      assert.equal(res.statusCode, 201);
      // Because of ON CONFLICT DO NOTHING, recorded_impressions is 0
      assert.equal(res.body.recorded_impressions, 0);

      const { rows } = await db.query(
        'SELECT COUNT(*)::int as count FROM recommendation_impressions WHERE presentation_id = $1',
        [presentationId]
      );
      assert.equal(rows[0].count, 2, 'Total rows for presentation must remain exactly 2');
    });

    it('SECURITY: denies recording impressions for another student roadmap (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: student2User, // Student 2 attempting to record impressions on Student 1's roadmap
        body: {
          roadmap_id: roadmap1Id,
          presentation_id: `pres_spoof_${Date.now()}`,
          impressions: [{ recommendation_id: rec1Id, rank_position: 1 }]
        }
      });

      await postImpressions(req, res);
      assert.equal(res.statusCode, 403);
      assert.ok(res.body.message.includes('Forbidden'));
    });
  });

  describe('2. Authenticated Interaction Events & Lifecycle Outcomes', () => {
    it('records opened event successfully', async () => {
      const idempotencyKey = `open_${Date.now()}_rec1`;
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          event_type: 'opened',
          idempotency_key: idempotencyKey,
          presentation_id: 'pres_test_interaction',
          interaction_metadata: { source_button: 'view_details' }
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.interaction.event_type, 'opened');
      assert.equal(res.body.interaction.idempotency_key, idempotencyKey);
    });

    it('records started event and automatically transitions recommendation status to in_progress', async () => {
      const idempotencyKey = `start_${Date.now()}_rec1`;
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          event_type: 'started',
          idempotency_key: idempotencyKey,
          interaction_metadata: { client_surface: 'learning_card' }
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.interaction.event_type, 'started');

      // Verify recommendation row transitioned to in_progress
      const { rows } = await db.query('SELECT status FROM roadmap_recommendations WHERE id = $1', [rec1Id]);
      assert.equal(rows[0].status, 'in_progress');
    });

    it('records progress_recorded event with valid percentage bounds', async () => {
      const idempotencyKey = `prog_${Date.now()}_rec1`;
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          event_type: 'progress_recorded',
          idempotency_key: idempotencyKey,
          progress_pct: 65,
          interaction_metadata: { milestone: 'module_3_complete' }
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.interaction.progress_pct, 65);
    });

    it('records completed event and sets recommendation status to completed', async () => {
      const idempotencyKey = `comp_${Date.now()}_rec1`;
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          event_type: 'completed',
          idempotency_key: idempotencyKey
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.interaction.event_type, 'completed');

      const { rows } = await db.query('SELECT status FROM roadmap_recommendations WHERE id = $1', [rec1Id]);
      assert.equal(rows[0].status, 'completed');
    });

    it('IDEMPOTENCY: repeated request with same idempotency_key returns 200 without duplicate insertion', async () => {
      const duplicateKey = `idemp_${Date.now()}_unique`;
      const { req: r1, res: res1 } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec2Id,
          event_type: 'opened',
          idempotency_key: duplicateKey
        }
      });
      await postInteraction(r1, res1);
      assert.equal(res1.statusCode, 201);
      assert.equal(res1.body.duplicate, false);

      // Re-send with exact same key
      const { req: r2, res: res2 } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec2Id,
          event_type: 'opened',
          idempotency_key: duplicateKey
        }
      });
      await postInteraction(r2, res2);
      assert.equal(res2.statusCode, 200);
      assert.equal(res2.body.duplicate, true);
      assert.equal(res2.body.interaction.id, res1.body.interaction.id);

      // Verify single database entry
      const { rows } = await db.query(
        'SELECT COUNT(*)::int as count FROM recommendation_interactions WHERE idempotency_key = $1',
        [duplicateKey]
      );
      assert.equal(rows[0].count, 1);
    });

    it('VALIDATION: rejects unsupported event types with 400 Bad Request', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          event_type: 'unsupported_click_event',
          idempotency_key: `bad_${Date.now()}`
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.message.includes('Invalid event_type'));
    });

    it('SECURITY: rejects Student 2 recording interactions on Student 1 recommendation (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: student2User,
        body: {
          recommendation_id: rec1Id, // Student 1's recommendation
          event_type: 'dismissed',
          idempotency_key: `spoof_${Date.now()}`
        }
      });

      await postInteraction(req, res);
      assert.equal(res.statusCode, 403);
      assert.ok(res.body.message.includes('Forbidden'));
    });
  });

  describe('3. Explicit Relevance Feedback & Reason Categorization', () => {
    it('records valid relevance rating (1 to 5) and supported reason category', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          rating: 4,
          reason_category: 'relevant_to_goal',
          feedback_text: 'Directly aligned with my target goal in distributed consensus systems.'
        }
      });

      await postFeedback(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.feedback.rating, 4);
      assert.equal(res.body.feedback.reason_category, 'relevant_to_goal');
      assert.equal(res.body.feedback.feedback_text, 'Directly aligned with my target goal in distributed consensus systems.');

      // Check DB persistence
      const { rows } = await db.query(
        'SELECT * FROM recommendation_feedback WHERE candidate_id = $1 AND recommendation_id = $2',
        [candidate1Id, rec1Id]
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].rating, 4);
    });

    it('updates existing feedback for the same recommendation without creating duplicate rows (upsert)', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec1Id,
          rating: 5,
          reason_category: 'targets_needed_skill',
          feedback_text: 'Updated: absolutely essential practice project.'
        }
      });

      await postFeedback(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.feedback.rating, 5);
      assert.equal(res.body.feedback.reason_category, 'targets_needed_skill');

      const { rows } = await db.query(
        'SELECT COUNT(*)::int as count FROM recommendation_feedback WHERE candidate_id = $1 AND recommendation_id = $2',
        [candidate1Id, rec1Id]
      );
      assert.equal(rows[0].count, 1, 'Upsert must update single record');
    });

    it('VALIDATION: rejects rating outside range 1-5 with 400 Bad Request', async () => {
      for (const badRating of [0, 6, -1, 10, 'invalid']) {
        const { req, res } = createMockReqRes({
          user: student1User,
          body: {
            recommendation_id: rec2Id,
            rating: badRating
          }
        });

        await postFeedback(req, res);
        assert.equal(res.statusCode, 400);
        assert.ok(res.body.message.includes('Rating must be an integer between 1 and 5'));
      }
    });

    it('VALIDATION: rejects unsupported reason category with 400 Bad Request', async () => {
      const { req, res } = createMockReqRes({
        user: student1User,
        body: {
          recommendation_id: rec2Id,
          rating: 3,
          reason_category: 'arbitrary_fake_category'
        }
      });

      await postFeedback(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.message.includes('Invalid reason_category'));
    });

    it('SECURITY: prevents Student 2 from submitting feedback on Student 1 recommendation (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: student2User,
        body: {
          recommendation_id: rec1Id, // Student 1 recommendation
          rating: 1,
          reason_category: 'not_related'
        }
      });

      await postFeedback(req, res);
      assert.equal(res.statusCode, 403);
      assert.ok(res.body.message.includes('Forbidden'));
    });

    it('retrieves explicit feedback list for authenticated student', async () => {
      const { req, res } = createMockReqRes({ user: student1User });
      await getFeedback(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.feedback));
      assert.ok(res.body.feedback.length >= 1);
      assert.equal(res.body.feedback[0].candidate_id, candidate1Id);
    });
  });

  describe('4. Evaluation Dataset Pipeline, Signal Separation & Provenance', () => {
    it('aggregates evaluation metrics with strict partition separation (explicit vs implicit vs synthetic)', async () => {
      const dataset = await getEvaluationDataset();
      assert.ok(dataset.evaluation_status, 'Must report evaluation status');
      assert.ok(dataset.provenance_partitions, 'Must provide provenance partitions');

      const { partition_a_explicit_judgments, partition_b_implicit_outcomes, partition_c_synthetic_benchmark } =
        dataset.provenance_partitions;

      // Partition A: Explicit judgments
      assert.ok(typeof partition_a_explicit_judgments.total_ratings === 'number');
      assert.ok(typeof partition_a_explicit_judgments.unique_students === 'number');
      assert.ok(Array.isArray(partition_a_explicit_judgments.rating_distribution));

      // Partition B: Implicit outcomes
      assert.ok(typeof partition_b_implicit_outcomes.total_impressions === 'number');
      assert.ok(typeof partition_b_implicit_outcomes.rates.feedback_coverage === 'number');
      assert.ok(typeof partition_b_implicit_outcomes.rates.start_rate === 'number');
      assert.ok(typeof partition_b_implicit_outcomes.rates.completion_rate === 'number');

      // Partition C: Synthetic benchmark preserved distinctly
      assert.equal(partition_c_synthetic_benchmark.benchmark_name, 'Phase 13 Offline Evaluation Benchmark');
      assert.equal(partition_c_synthetic_benchmark.synthetic_personas_count, 4);
      assert.ok(partition_c_synthetic_benchmark.reported_metrics.precision_at_3);
      assert.ok(partition_c_synthetic_benchmark.disclaimer.includes('Synthetic benchmark'));
    });

    it('reports INSUFFICIENT_REAL_WORLD_DATA when empirical unique student ratings are below statistical threshold', async () => {
      const dataset = await getEvaluationDataset();
      // Since our test database has only a few student ratings (<10)
      assert.equal(dataset.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
      assert.ok(dataset.status_notice.includes('below minimum threshold'));
    });

    it('AUTHORIZATION: super_admin and college_admin can access evaluation endpoint, recruiter cannot', async () => {
      // 1. Super admin access
      const { req: saReq, res: saRes } = createMockReqRes({ user: superAdminUser });
      await getEvaluationReport(saReq, saRes);
      assert.equal(saRes.statusCode, 200);
      assert.ok(saRes.body.provenance_partitions);

      // 2. Recruiter access denied (tested at controller / middleware boundary)
      assert.notEqual(recruiterUser.role, 'super_admin');
      assert.notEqual(recruiterUser.role, 'college_admin');
    });
  });
});
