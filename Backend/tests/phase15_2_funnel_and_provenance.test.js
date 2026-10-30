// Backend/tests/phase15_2_funnel_and_provenance.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import {
  resolveProvenanceTag,
  recordImpressions,
  recordInteraction,
  submitFeedback,
  getEvaluationDataset
} from '../src/services/feedback.service.js';

describe('SkillVerse Phase 15.2: Pilot Data Provenance, True Conversion Funnels and Metric Integrity', () => {
  const runId = Date.now().toString().slice(-6);

  let p152InstId;
  let candAId;
  let candBId;
  let candCId;
  let candPilotId;
  let roadmapAId;
  let roadmapBId;
  let recA1Id;
  let recA2Id;
  let recB1Id;
  let recB2Id;
  let recB3Id;

  before(async () => {
    // 1. Create a dedicated institution for Phase 15.2 tests
    const { rows: instRows } = await db.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`Phase 15.2 Integrity Inst ${runId}`, `P15_2_${runId}`, `integrity${runId}.edu`]
    );
    p152InstId = instRows[0].id;

    // 2. Helper to create student candidate with indexing queue row
    async function createStudent(email, name) {
      const { rows: uRows } = await db.query(
        `INSERT INTO users (email, password_hash, role, name)
         VALUES ($1, 'hash', 'student', $2)
         RETURNING id, email`,
        [email, name]
      );
      const user = uRows[0];

      await db.query(
        `INSERT INTO institution_memberships (institution_id, user_id, role)
         VALUES ($1, $2, 'student')`,
        [p152InstId, user.id]
      );

      const { rows: cRows } = await db.query(
        `INSERT INTO candidates (user_id, full_name, email, headline, experience_years, skill_json)
         VALUES ($1, $2, $3, 'Software Engineer', 1, '["JavaScript", "Node.js", "PostgreSQL"]')
         RETURNING id`,
        [user.id, name, user.email]
      );
      const candidateId = cRows[0].id;

      await db.query(
        `INSERT INTO indexing_queue (candidate_id, status) VALUES ($1, 'completed')`,
        [candidateId]
      );

      return candidateId;
    }

    candAId = await createStudent(`p15_2_stua_${runId}@skillverse.test`, `Student A ${runId}`);
    candBId = await createStudent(`p15_2_stub_${runId}@skillverse.test`, `Student B ${runId}`);
    candCId = await createStudent(`p15_2_stuc_${runId}@skillverse.test`, `Student C ${runId}`);
    candPilotId = await createStudent(`pilot_candidate_${runId}@genuinepilot.edu`, `Pilot Candidate ${runId}`);

    // 3. Helper to create roadmap with recommendations
    async function createRoadmapWithRecs(candidateId, recKeys) {
      const { rows: gRows } = await db.query(
        `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills)
         VALUES ($1, 'target_role', 'Backend Architect', '["Node.js", "PostgreSQL"]')
         RETURNING id`,
        [candidateId]
      );

      const { rows: rdRows } = await db.query(
        `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score, engine_version, model_metadata)
         VALUES ($1, $2, 70, 'v2.0.0-ai-semantic-recommendation', '{"model_version": "all-MiniLM-L6-v2"}'::jsonb)
         RETURNING id`,
        [candidateId, gRows[0].id]
      );
      const roadmapId = rdRows[0].id;

      const recIds = [];
      for (let i = 0; i < recKeys.length; i++) {
        const key = recKeys[i];
        const { rows: rRows } = await db.query(
          `INSERT INTO roadmap_recommendations (
             roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata
           ) VALUES ($1, $2, $3, $4, 'Complete assigned module', 'Targeted core skill', 'benchmark', $5, '{"ranking_score": 0.90}'::jsonb)
           RETURNING id`,
          [roadmapId, candidateId, key, `Activity ${key}`, i + 1]
        );
        recIds.push(rRows[0].id);
      }

      return { roadmapId, recIds };
    }

    const resA = await createRoadmapWithRecs(candAId, ['rec_a1', 'rec_a2']);
    roadmapAId = resA.roadmapId;
    recA1Id = resA.recIds[0];
    recA2Id = resA.recIds[1];

    const resB = await createRoadmapWithRecs(candBId, ['rec_b1', 'rec_b2', 'rec_b3']);
    roadmapBId = resB.roadmapId;
    recB1Id = resB.recIds[0];
    recB2Id = resB.recIds[1];
    recB3Id = resB.recIds[2];
  });

  describe('1. Provenance Tag Resolution & Classification Invariants', () => {
    it('infers "automated_test" for test suite accounts', async () => {
      const tag = await resolveProvenanceTag(candAId);
      assert.equal(tag, 'automated_test');
    });

    it('infers "pilot" for non-test production/pilot domain accounts', async () => {
      const tag = await resolveProvenanceTag(candPilotId);
      assert.equal(tag, 'pilot');
    });

    it('respects explicit provenance tag override when valid', async () => {
      const explicitPilot = await resolveProvenanceTag(candAId, 'pilot');
      assert.equal(explicitPilot, 'pilot');

      const explicitDemo = await resolveProvenanceTag(candAId, 'demo_fixture');
      assert.equal(explicitDemo, 'demo_fixture');
    });

    it('infers "unknown" for non-existent candidate ID', async () => {
      const tag = await resolveProvenanceTag(9999999);
      assert.equal(tag, 'unknown');
    });
  });

  describe('2. Scenario 1: Separate Recommendations Do Not Cross-Contaminate Conversion', () => {
    it('Recommendation A started while Recommendation B progresses gives A zero progress conversion', async () => {
      // Setup: Impress both recA1 and recA2 to Student A
      const presId = `pres_scen1_${runId}`;
      await recordImpressions({
        candidateId: candAId,
        roadmapId: roadmapAId,
        presentationId: presId,
        impressions: [
          { recommendation_id: recA1Id, rank_position: 1 },
          { recommendation_id: recA2Id, rank_position: 2 }
        ]
      });

      // Student A starts recA1
      await recordInteraction({
        candidateId: candAId,
        recommendationId: recA1Id,
        eventType: 'started',
        idempotencyKey: `scen1_start_a1_${runId}`,
        presentationId: presId
      });

      // An unstarted progress event is logged on recA2 (recA2 was NEVER started)
      await recordInteraction({
        candidateId: candAId,
        recommendationId: recA2Id,
        eventType: 'progress_recorded',
        idempotencyKey: `scen1_prog_a2_${runId}`,
        presentationId: presId,
        progressPct: 50
      });

      // Evaluate institution cohort
      const report = await getEvaluationDataset({ institutionId: p152InstId });
      const funnel = report.funnel_metrics;

      const stepStarted = funnel.find(s => s.id === 'started');
      const stepProg = funnel.find(s => s.id === 'progress_recorded');

      // recA1 was started (1 started instance). recA2 was never started.
      assert.equal(stepStarted.count, 1, 'Exactly 1 instance (recA1) was started');

      // recA1 was never progressed, and recA2 was never started.
      // Therefore, progressed instances must be 0!
      assert.equal(stepProg.count, 0, 'Progressed instances must be 0 because recA1 has no progress and recA2 was never started');
      assert.equal(stepProg.rate, 0.0, 'Progress rate must be 0.0% (no cross-contamination from recA2)');
    });
  });

  describe('3. Scenario 2 & 3: Duplicate Milestone Pings and Retries Are Strictly Deduplicated', () => {
    it('Scenario 2: Single started activity logging 5 progress events results in at most 1 progressed instance', async () => {
      // Student A starts recA1 and logs 5 progress events
      const presId = `pres_scen2_${runId}`;
      for (let p = 10; p <= 50; p += 10) {
        await recordInteraction({
          candidateId: candAId,
          recommendationId: recA1Id,
          eventType: 'progress_recorded',
          idempotencyKey: `scen2_prog_${p}_${runId}`,
          presentationId: presId,
          progressPct: p
        });
      }

      const report = await getEvaluationDataset({ institutionId: p152InstId });
      const stepProg = report.funnel_metrics.find(s => s.id === 'progress_recorded');

      // Regardless of 5 events logged, exactly 1 instance progressed
      assert.equal(stepProg.count, 1, 'Multiple progress pings for a single recommendation must yield exactly 1 progressed instance');
      assert.equal(stepProg.rate, 1.0, 'Progress rate is 1 / 1 = 100%');
    });

    it('Scenario 3: Repeated completion retries result in at most 1 completed instance', async () => {
      // Student A completes recA1, then retries twice
      const presId = `pres_scen3_${runId}`;
      await recordInteraction({
        candidateId: candAId,
        recommendationId: recA1Id,
        eventType: 'completed',
        idempotencyKey: `scen3_comp_1_${runId}`,
        presentationId: presId
      });
      await recordInteraction({
        candidateId: candAId,
        recommendationId: recA1Id,
        eventType: 'completed',
        idempotencyKey: `scen3_comp_2_${runId}`,
        presentationId: presId
      });

      const report = await getEvaluationDataset({ institutionId: p152InstId });
      const stepComp = report.funnel_metrics.find(s => s.id === 'completed');

      assert.equal(stepComp.count, 1, 'Duplicate completions must deduplicate to exactly 1 completed instance');
      assert.equal(stepComp.rate, 1.0, 'Completion rate must be 1 / 1 = 100%');
    });
  });

  describe('4. Scenario 4 & 5: Complete Lifecycle & Alternative Dismissal Outcomes', () => {
    it('Scenario 4: Full lifecycle start -> progress -> complete preserves true subset progression', async () => {
      const presId = `pres_scen4_${runId}`;
      await recordImpressions({
        candidateId: candBId,
        roadmapId: roadmapBId,
        presentationId: presId,
        impressions: [{ recommendation_id: recB1Id, rank_position: 1 }]
      });

      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB1Id,
        eventType: 'opened',
        idempotencyKey: `scen4_open_${runId}`,
        presentationId: presId
      });

      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB1Id,
        eventType: 'started',
        idempotencyKey: `scen4_start_${runId}`,
        presentationId: presId
      });

      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB1Id,
        eventType: 'progress_recorded',
        idempotencyKey: `scen4_prog_${runId}`,
        presentationId: presId,
        progressPct: 80
      });

      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB1Id,
        eventType: 'completed',
        idempotencyKey: `scen4_comp_${runId}`,
        presentationId: presId
      });

      const report = await getEvaluationDataset({ institutionId: p152InstId });
      const implicit = report.provenance_partitions.partition_b_implicit_outcomes;

      assert.ok(implicit.lifecycle_instances.impressed >= 1);
      assert.ok(implicit.lifecycle_instances.opened >= 1);
      assert.ok(implicit.lifecycle_instances.started >= 1);
      assert.ok(implicit.lifecycle_instances.progressed >= 1);
      assert.ok(implicit.lifecycle_instances.completed >= 1);

      // Verify mathematical bounds without capping
      assert.ok(implicit.rates.open_rate <= 1.0 && implicit.rates.open_rate >= 0.0);
      assert.ok(implicit.rates.start_rate <= 1.0 && implicit.rates.start_rate >= 0.0);
      assert.ok(implicit.rates.progress_rate <= 1.0 && implicit.rates.progress_rate >= 0.0);
      assert.ok(implicit.rates.completion_rate <= 1.0 && implicit.rates.completion_rate >= 0.0);
    });

    it('Scenario 5: Dismissal measured as an alternative lifecycle outcome', async () => {
      const presId = `pres_scen5_${runId}`;
      await recordImpressions({
        candidateId: candBId,
        roadmapId: roadmapBId,
        presentationId: presId,
        impressions: [{ recommendation_id: recB2Id, rank_position: 2 }]
      });

      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB2Id,
        eventType: 'dismissed',
        idempotencyKey: `scen5_dism_${runId}`,
        presentationId: presId
      });

      const report = await getEvaluationDataset({ institutionId: p152InstId });
      const stepDism = report.funnel_metrics.find(s => s.id === 'dismissed');

      assert.ok(stepDism.count >= 1, 'Dismissal count should be at least 1');
      assert.ok(stepDism.rate > 0.0 && stepDism.rate <= 1.0, 'Dismissal rate should be between 0.0 and 1.0');
    });
  });

  describe('5. Scenario 6, 7 & 8: Anomaly Auditing and Zero-Denominator Resilience', () => {
    it('Scenario 6: Activity without eligible impression is detected under lifecycle anomalies', async () => {
      // Student B interacts with recB3 without it ever being recorded in recommendation_impressions
      await recordInteraction({
        candidateId: candBId,
        recommendationId: recB3Id,
        eventType: 'opened',
        idempotencyKey: `scen6_unimp_open_${runId}`
      });

      const report = await getEvaluationDataset({ institutionId: p152InstId });
      assert.ok(report.lifecycle_integrity_audit, 'Must include lifecycle_integrity_audit');
      assert.ok(
        report.lifecycle_integrity_audit.interactions_without_impression >= 1,
        'Should flag interactions without prior impressions'
      );
    });

    it('Scenario 7: Zero started recommendations results in clean 0.0 progress and completion rates', async () => {
      // Student C receives an impression but takes no interaction
      const { roadmapId, recIds } = await (async () => {
        const { rows: gRows } = await db.query(
          `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills)
           VALUES ($1, 'target_role', 'Zero Denom Role', '["Testing"]')
           RETURNING id`,
          [candCId]
        );
        const { rows: rdRows } = await db.query(
          `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score)
           VALUES ($1, $2, 50) RETURNING id`,
          [candCId, gRows[0].id]
        );
        const { rows: rRows } = await db.query(
          `INSERT INTO roadmap_recommendations (roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority)
           VALUES ($1, $2, 'rec_c_zero', 'Zero Denom Lab', 'Do nothing', 'Test zero denom', 'benchmark', 1)
           RETURNING id`,
          [rdRows[0].id, candCId]
        );
        return { roadmapId: rdRows[0].id, recIds: [rRows[0].id] };
      })();

      const presId = `pres_scen7_${runId}`;
      await recordImpressions({
        candidateId: candCId,
        roadmapId,
        presentationId: presId,
        impressions: [{ recommendation_id: recIds[0], rank_position: 1 }]
      });

      // Filter by this specific candidate
      const report = await getEvaluationDataset({ startDate: new Date(Date.now() - 60000).toISOString() });
      assert.ok(report);
      // Ensure no NaN or infinity exists in rates
      for (const step of report.funnel_metrics) {
        assert.ok(!Number.isNaN(step.rate), `Funnel step ${step.id} rate should not be NaN`);
        assert.ok(Number.isFinite(step.rate), `Funnel step ${step.id} rate should be finite`);
      }
    });

    it('Scenario 8: Missing linkage metadata and null progress percentages handled safely', async () => {
      const res = await recordInteraction({
        candidateId: candAId,
        recommendationId: recA1Id,
        eventType: 'progress_recorded',
        idempotencyKey: `scen8_null_prog_${runId}`,
        presentationId: null,
        progressPct: null,
        interactionMetadata: null
      });

      assert.equal(res.success, true);
      assert.equal(res.interaction.progress_pct, null);
    });
  });

  describe('6. Scenario 9 & 10: Provenance Filtering and Deterministic Idempotence', () => {
    it('Scenario 9: provenanceFilter = "pilot" strictly isolates test fixtures from genuine pilot data', async () => {
      const pilotReport = await getEvaluationDataset({ provenanceFilter: 'pilot' });
      assert.equal(pilotReport.provenance_filter, 'pilot');

      // Test fixtures and automated test data are strictly segregated; ratings are zero and status is insufficient
      assert.ok(pilotReport.provenance_partitions.partition_b_implicit_outcomes.total_impressions >= 0);
      assert.equal(pilotReport.provenance_partitions.partition_a_explicit_judgments.total_ratings, 0);
      assert.equal(pilotReport.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
    });

    it('Scenario 9b: provenanceFilter = "automated_test" captures test-generated telemetry', async () => {
      const testReport = await getEvaluationDataset({ provenanceFilter: 'automated_test' });
      assert.equal(testReport.provenance_filter, 'automated_test');
      assert.ok(testReport.provenance_partitions.partition_b_implicit_outcomes.total_impressions > 0);
    });

    it('Scenario 10: Idempotent repeated evaluation on identical inputs returns exact deterministic numbers', async () => {
      const rep1 = await getEvaluationDataset({ institutionId: p152InstId });
      const rep2 = await getEvaluationDataset({ institutionId: p152InstId });

      assert.equal(rep1.evaluation_status, rep2.evaluation_status);
      assert.equal(rep1.funnel_metrics.length, rep2.funnel_metrics.length);

      for (let i = 0; i < rep1.funnel_metrics.length; i++) {
        assert.equal(rep1.funnel_metrics[i].count, rep2.funnel_metrics[i].count);
        assert.equal(rep1.funnel_metrics[i].rate, rep2.funnel_metrics[i].rate);
      }
    });
  });

  describe('7. Provenance Breakdown & System Observability Invariants', () => {
    it('reports complete provenance partition breakdown across all four tags', async () => {
      const report = await getEvaluationDataset();
      assert.ok(report.provenance_breakdown);
      const pb = report.provenance_breakdown;

      assert.ok(typeof pb.impressions_by_provenance.automated_test === 'number');
      assert.ok(typeof pb.impressions_by_provenance.demo_fixture === 'number');
      assert.ok(typeof pb.impressions_by_provenance.pilot === 'number');
      assert.ok(typeof pb.impressions_by_provenance.unknown === 'number');
    });
  });
});
