// Backend/tests/phase15_effectiveness_dashboard.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { getEvaluationDataset } from '../src/services/feedback.service.js';
import { getEvaluationReport } from '../src/controllers/feedback.controller.js';

describe('SkillVerse Phase 15: Recommendation Effectiveness Dashboard & Pilot Readiness Suite', () => {
  let superAdminUser;
  let collegeAdmin1User;
  let collegeAdminNoInstUser;
  let studentUser;
  let recruiterUser;
  let institution1Id;
  let institution2Id;
  let candidate1Id;
  let candidate2Id;
  let roadmap1Id;
  let rec1Id;
  let rec2Id;

  const createMockReqRes = ({ user = null, query = {}, body = {}, params = {} } = {}) => {
    const req = { user, query, body, params };
    let statusCode = 200;
    let responseBody = null;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        responseBody = payload;
        return this;
      },
      get statusCode() {
        return statusCode;
      },
      get body() {
        return responseBody;
      }
    };

    return { req, res };
  };

  before(async () => {
    const runId = Date.now().toString().slice(-6);

    // 1. Create Super Admin
    const { rows: saRows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, 'hash', 'super_admin', 'Global Admin P15')
       RETURNING id, role, email, name`,
      [`sa_p15_${runId}@skillverse.ai`]
    );
    superAdminUser = saRows[0];

    // 2. Create Two Registered Institutions
    const { rows: inst1Rows } = await db.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ($1, $2, $3)
       RETURNING id, name, code, domain`,
      [`Apex Institute P15 ${runId}`, `APEX_${runId}`, `apex${runId}.edu`]
    );
    institution1Id = inst1Rows[0].id;

    const { rows: inst2Rows } = await db.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ($1, $2, $3)
       RETURNING id, name, code, domain`,
      [`Metro Tech P15 ${runId}`, `METRO_${runId}`, `metro${runId}.edu`]
    );
    institution2Id = inst2Rows[0].id;

    // 3. Create College Admin for Institution 1
    const { rows: ca1Rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, 'hash', 'college_admin', 'Dean Apex P15')
       RETURNING id, role, email, name`,
      [`dean_apex_${runId}@apex.edu`]
    );
    collegeAdmin1User = ca1Rows[0];

    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'college_admin')`,
      [institution1Id, collegeAdmin1User.id]
    );

    // 4. Create College Admin with NO institution membership
    const { rows: caNoInstRows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, 'hash', 'college_admin', 'Dean Unassigned P15')
       RETURNING id, role, email, name`,
      [`dean_unassigned_${runId}@unknown.edu`]
    );
    collegeAdminNoInstUser = caNoInstRows[0];

    // 5. Create Recruiter & Student users
    const { rows: recrRows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, 'hash', 'recruiter', 'Recruiter P15')
       RETURNING id, role, email, name`,
      [`recr_p15_${runId}@talent.io`]
    );
    recruiterUser = recrRows[0];

    const { rows: stuRows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, 'hash', 'student', 'Student Apex P15')
       RETURNING id, role, email, name`,
      [`stu_apex_${runId}@apex.edu`]
    );
    studentUser = stuRows[0];

    // Bind student to Institution 1
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'student')`,
      [institution1Id, studentUser.id]
    );

    // Create Candidate profile for student
    const { rows: candRows } = await db.query(
      `INSERT INTO candidates (user_id, full_name, email, headline, experience_years, skill_json)
       VALUES ($1, 'Student Apex P15', $2, 'Computer Science Junior', 1, '["Python", "FastAPI"]')
       RETURNING id`,
      [studentUser.id, studentUser.email]
    );
    candidate1Id = candRows[0].id;

    // Maintain outbox atomicity invariant
    await db.query(
      `INSERT INTO indexing_queue (candidate_id, status) VALUES ($1, 'completed')`,
      [candidate1Id]
    );

    // 6. Create Goal, Roadmap, and Recommendations
    const { rows: goalRows } = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills)
       VALUES ($1, 'target_role', 'Cloud Architect', '["Python", "Docker", "Kubernetes"]')
       RETURNING id`,
      [candidate1Id]
    );
    const goalId = goalRows[0].id;

    const { rows: roadmapRows } = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score, engine_version, model_metadata)
       VALUES ($1, $2, 65, 'v2.0.0-ai-semantic-recommendation', '{"model_version": "all-MiniLM-L6-v2"}'::jsonb)
       RETURNING id`,
      [candidate1Id, goalId]
    );
    roadmap1Id = roadmapRows[0].id;

    const { rows: rec1Rows } = await db.query(
      `INSERT INTO roadmap_recommendations (roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata)
       VALUES ($1, $2, 'rec_docker_p15', 'Docker Microservices Lab', 'Complete Docker compose lab', 'High demand skill', 'benchmark', 1, '{"ranking_score": 0.92, "model_version": "all-MiniLM-L6-v2"}'::jsonb)
       RETURNING id`,
      [roadmap1Id, candidate1Id]
    );
    rec1Id = rec1Rows[0].id;

    const { rows: rec2Rows } = await db.query(
      `INSERT INTO roadmap_recommendations (roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata)
       VALUES ($1, $2, 'rec_k8s_p15', 'Kubernetes Operators', 'Deploy sample operator', 'Required for cloud architect', 'project', 2, '{"ranking_score": 0.85, "model_version": "all-MiniLM-L6-v2"}'::jsonb)
       RETURNING id`,
      [roadmap1Id, candidate1Id]
    );
    rec2Id = rec2Rows[0].id;

    // 7. Seed impressions for Student 1
    const presentationId = `pres_p15_${runId}`;
    await db.query(
      `INSERT INTO recommendation_impressions (
        presentation_id, candidate_id, roadmap_id, recommendation_id,
        rank_position, engine_version, model_version, ranking_score, score_breakdown, surface
      ) VALUES 
        ($1, $2, $3, $4, 1, 'v2.0.0-ai-semantic-recommendation', 'all-MiniLM-L6-v2', 0.9200, '{"semantic_similarity": 0.90}'::jsonb, 'learning_roadmap'),
        ($1, $2, $3, $5, 2, 'v2.0.0-ai-semantic-recommendation', 'all-MiniLM-L6-v2', 0.8500, '{"semantic_similarity": 0.82}'::jsonb, 'learning_roadmap')
      ON CONFLICT DO NOTHING`,
      [presentationId, candidate1Id, roadmap1Id, rec1Id, rec2Id]
    );

    // 8. Seed interaction lifecycle events
    await db.query(
      `INSERT INTO recommendation_interactions (
        presentation_id, candidate_id, recommendation_id, event_type, engine_version, idempotency_key
      ) VALUES
        ($1, $2, $3, 'opened', 'v2.0.0-ai-semantic-recommendation', $4),
        ($1, $2, $3, 'started', 'v2.0.0-ai-semantic-recommendation', $5),
        ($1, $2, $3, 'progress_recorded', 'v2.0.0-ai-semantic-recommendation', $6),
        ($1, $2, $3, 'completed', 'v2.0.0-ai-semantic-recommendation', $7)
      ON CONFLICT DO NOTHING`,
      [
        presentationId,
        candidate1Id,
        rec1Id,
        `evt_open_${runId}`,
        `evt_start_${runId}`,
        `evt_prog_${runId}`,
        `evt_comp_${runId}`
      ]
    );

    // 9. Seed explicit feedback
    await db.query(
      `INSERT INTO recommendation_feedback (
        presentation_id, candidate_id, recommendation_id, rating, reason_category, feedback_text
      ) VALUES
        ($1, $2, $3, 5, 'targets_needed_skill', 'Excellent lab for Docker')
      ON CONFLICT DO NOTHING`,
      [presentationId, candidate1Id, rec1Id]
    );
  });

  describe('1. Super Administrator Platform-Level Observability', () => {
    it('returns platform-wide aggregate metrics when no institution is specified', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution_id, null);
      assert.equal(res.body.institution_name, 'All Institutions (Platform-Wide)');
      assert.ok(res.body.provenance_partitions);
      assert.ok(res.body.funnel_metrics);
      assert.ok(Array.isArray(res.body.disclaimers));
    });

    it('allows super administrator to optionally inspect a specific institution', async () => {
      const { req, res } = createMockReqRes({
        user: superAdminUser,
        query: { institution_id: String(institution1Id) }
      });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution_id, institution1Id);
      assert.ok(res.body.institution_name.includes('Apex Institute'));
    });
  });

  describe('2. College Administrator Tenant Scoping & Isolation', () => {
    it('automatically scopes evaluation metrics to the college administrator verified institution', async () => {
      const { req, res } = createMockReqRes({ user: collegeAdmin1User });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.institution_id, institution1Id);
      assert.ok(res.body.institution_name.includes('Apex Institute'));
      assert.ok(res.body.provenance_partitions);
    });

    it('CROSS-TENANT DEFENSE: denies college administrator requesting another institution with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdmin1User,
        query: { institution_id: String(institution2Id) }
      });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Forbidden'));
      assert.ok(res.body.message.includes('another institution'));
    });

    it('reports TENANT_NOT_FOUND when college admin has no active institution affiliation', async () => {
      const { req, res } = createMockReqRes({ user: collegeAdminNoInstUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.evaluation_status, 'TENANT_NOT_FOUND');
      assert.ok(res.body.status_notice.includes('Institution affiliation not established'));
      assert.equal(res.body.institution_id, null);
    });
  });

  describe('3. Role Authorization Boundaries', () => {
    it('strictly denies recruiter access with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({ user: recruiterUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Forbidden'));
    });

    it('strictly denies student access to administrative evaluation endpoint with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({ user: studentUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Forbidden'));
    });
  });

  describe('4. Funnel Metrics & Mathematical Rate Formulations', () => {
    it('verifies funnel structure, step orders, and explicit rate formulas', async () => {
      const report = await getEvaluationDataset({ institutionId: institution1Id });

      assert.ok(Array.isArray(report.funnel_metrics));
      assert.equal(report.funnel_metrics.length, 6);

      const [mImpressions, mOpened, mStarted, mProgress, mCompleted, mDismissed] = report.funnel_metrics;

      // Step 1: Impressions
      assert.equal(mImpressions.id, 'impressions');
      assert.equal(mImpressions.rate, 1.0);
      assert.ok(mImpressions.count >= 2);

      // Step 2: Opened (CTR = opened / impressions)
      assert.equal(mOpened.id, 'opened');
      assert.equal(mOpened.formula, 'opened / total_impressions');
      assert.ok(mOpened.count >= 1);

      // Step 3: Started (start_rate = started / impressions)
      assert.equal(mStarted.id, 'started');
      assert.equal(mStarted.formula, 'started / total_impressions');
      assert.ok(mStarted.count >= 1);

      // Step 4: Progress Recorded (progress_rate = progress / started)
      assert.equal(mProgress.id, 'progress_recorded');
      assert.equal(mProgress.formula, 'progress_recorded / started');

      // Step 5: Completed (completion_rate = completed / started)
      assert.equal(mCompleted.id, 'completed');
      assert.equal(mCompleted.formula, 'completed / started');
      assert.ok(mCompleted.description.includes('recorded progress, not verified Skill DNA mastery'));

      // Step 6: Dismissed (dismissal_rate = dismissed / impressions)
      assert.equal(mDismissed.id, 'dismissed');
      assert.equal(mDismissed.formula, 'dismissed / total_impressions');
    });
  });

  describe('5. Minimum Group Size Safeguards & Privacy Preservation', () => {
    it('activates privacy safeguard (k < 5) and summarizes granular distribution when cohort is small', async () => {
      const report = await getEvaluationDataset({ institutionId: institution1Id });

      // In our test institution, observed_students = 1 (< 5)
      assert.equal(report.minimum_group_size_safeguard, true);
      assert.ok(report.safeguard_notice.includes('k='));
      assert.ok(report.safeguard_notice.includes('preserve student privacy'));

      // Rating distribution is summarized to protect individual ratings
      const { rating_distribution } = report.provenance_partitions.partition_a_explicit_judgments;
      assert.ok(rating_distribution[0].rating.includes('Privacy Protected'));
    });
  });

  describe('6. Data Sufficiency State Transitions & Ranking Metadata', () => {
    it('reports INSUFFICIENT_REAL_WORLD_DATA when student ratings are below statistical threshold', async () => {
      const report = await getEvaluationDataset({ institutionId: institution1Id });

      assert.equal(report.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
      assert.ok(report.status_notice.includes('below minimum threshold'));
      assert.equal(report.active_engine_version, 'v2.0.0-ai-semantic-recommendation');
      assert.equal(report.active_model_version, 'all-MiniLM-L6-v2');
      assert.equal(report.online_retraining_enabled, false);
      assert.ok(report.ranking_weights.semantic_similarity > 0);
    });

    it('supports date range filtering without corrupting aggregate metrics', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const report = await getEvaluationDataset({
        startDate: pastDate,
        endDate: futureDate,
        institutionId: institution1Id
      });

      assert.equal(report.date_range.start_date, pastDate);
      assert.equal(report.date_range.end_date, futureDate);
      assert.ok(report.provenance_partitions.partition_b_implicit_outcomes.total_impressions >= 1);
    });
  });
});
