// Backend/tests/phase16_pilot_foundation.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import {
  createPilotProgram,
  getPilotPrograms,
  getPilotProgramById,
  updatePilotProgramStatus,
  optInToPilot,
  withdrawFromPilot,
  getStudentPilotStatus
} from '../src/services/pilot.service.js';
import {
  postCreateProgram,
  getListPrograms,
  getProgramDetails,
  patchProgramStatus,
  postStudentConsent,
  postStudentWithdraw,
  getStudentStatus
} from '../src/controllers/pilot.controller.js';
import {
  recordImpressions,
  recordInteraction,
  submitFeedback,
  resolveProvenanceTag,
  getEvaluationDataset
} from '../src/services/feedback.service.js';
import {
  postImpressions,
  postInteraction,
  postFeedback,
  getEvaluationReport
} from '../src/controllers/feedback.controller.js';

describe('SkillVerse Phase 16: Controlled Student Pilot Foundation and Explicit Data Provenance', () => {
  const runId = Date.now().toString().slice(-6);

  let instAId;
  let instBId;
  let superAdminUser;
  let collegeAdminAUser;
  let collegeAdminBUser;
  let studentA1User;
  let studentA2User;
  let studentBUser;
  let nonParticipantUser;

  let candA1Id;
  let candA2Id;
  let candBId;
  let candNonPartId;

  let roadmapA1Id;
  let recA1Id;
  let roadmapNonPartId;
  let recNonPartId;

  let pilotProgramAId;
  let pilotProgramBId;

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
    // 1. Create two test institutions
    const { rows: instARows } = await db.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`Phase 16 Apex Academy ${runId}`, `P16_APEX_${runId}`, `apex${runId}.edu`]
    );
    instAId = instARows[0].id;

    const { rows: instBRows } = await db.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`Phase 16 Horizon College ${runId}`, `P16_HORIZON_${runId}`, `horizon${runId}.edu`]
    );
    instBId = instBRows[0].id;

    // 2. Create users and institution memberships
    async function createUser(email, name, role, institutionId = null) {
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash, role, name)
         VALUES ($1, 'hash', $2, $3)
         RETURNING id, email, role, name`,
        [email, role, name]
      );
      const user = rows[0];

      if (institutionId) {
        await db.query(
          `INSERT INTO institution_memberships (institution_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [institutionId, user.id, role]
        );
      }
      return user;
    }

    async function createStudentCandidate(user, institutionId) {
      const { rows } = await db.query(
        `INSERT INTO candidates (user_id, full_name, email, headline, experience_years, skill_json)
         VALUES ($1, $2, $3, 'Pilot Candidate', 1, '["Python", "FastAPI", "React"]')
         RETURNING id`,
        [user.id, user.name, user.email]
      );
      const candidateId = rows[0].id;

      await db.query(
        `INSERT INTO indexing_queue (candidate_id, status) VALUES ($1, 'completed')`,
        [candidateId]
      );

      return candidateId;
    }

    superAdminUser = await createUser(`sa_p16_${runId}@skillverse.test`, 'Super Admin P16', 'super_admin');
    collegeAdminAUser = await createUser(`ca_apex_p16_${runId}@apex.edu`, 'Admin Apex P16', 'college_admin', instAId);
    collegeAdminBUser = await createUser(`ca_horiz_p16_${runId}@horizon.edu`, 'Admin Horizon P16', 'college_admin', instBId);

    studentA1User = await createUser(`pilot_stu_a1_${runId}@apex.edu`, 'Student A1 Apex', 'student', instAId);
    candA1Id = await createStudentCandidate(studentA1User, instAId);

    studentA2User = await createUser(`pilot_stu_a2_${runId}@apex.edu`, 'Student A2 Apex', 'student', instAId);
    candA2Id = await createStudentCandidate(studentA2User, instAId);

    studentBUser = await createUser(`pilot_stu_b_${runId}@horizon.edu`, 'Student B Horizon', 'student', instBId);
    candBId = await createStudentCandidate(studentBUser, instBId);

    nonParticipantUser = await createUser(`regular_student_${runId}@apex.edu`, 'Regular Student Apex', 'student', instAId);
    candNonPartId = await createStudentCandidate(nonParticipantUser, instAId);

    // 3. Helper to create roadmap with recommendations
    async function createRoadmapWithRecs(candidateId, key) {
      const { rows: gRows } = await db.query(
        `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills)
         VALUES ($1, 'target_role', 'AI Specialist', '["Python", "Machine Learning"]')
         RETURNING id`,
        [candidateId]
      );

      const { rows: rdRows } = await db.query(
        `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score, engine_version, model_metadata)
         VALUES ($1, $2, 75, 'v2.0.0-ai-semantic-recommendation', '{"model_version": "all-MiniLM-L6-v2"}'::jsonb)
         RETURNING id`,
        [candidateId, gRows[0].id]
      );
      const roadmapId = rdRows[0].id;

      const { rows: rRows } = await db.query(
        `INSERT INTO roadmap_recommendations (
           roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata
         ) VALUES ($1, $2, $3, $4, 'Complete core module', 'High priority AI skill', 'course', 1, '{"ranking_score": 0.95}'::jsonb)
         RETURNING id`,
        [roadmapId, candidateId, key, `AI Recommendation ${key}`]
      );

      return { roadmapId, recId: rRows[0].id };
    }

    const resA1 = await createRoadmapWithRecs(candA1Id, `rec_a1_${runId}`);
    roadmapA1Id = resA1.roadmapId;
    recA1Id = resA1.recId;

    const resNP = await createRoadmapWithRecs(candNonPartId, `rec_np_${runId}`);
    roadmapNonPartId = resNP.roadmapId;
    recNonPartId = resNP.recId;
  });

  describe('1. Pilot Program Administration & Tenant Scoping', () => {
    it('creates a tenant-scoped pilot program in "draft" status via controller', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminAUser,
        body: {
          name: `Apex Spring 2026 AI Pilot ${runId}`,
          code: `APEX_AI_${runId}`,
          target_engine_version: 'v2.0.0-ai-semantic-recommendation',
          consent_notice_version: 'v1.0',
          consent_notice_text: 'I voluntarily agree to participate in the SkillVerse AI recommendation pilot. My interactions and explicit ratings will be analyzed to assess algorithmic quality. I can withdraw at any time.'
        }
      });

      await postCreateProgram(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.program.status, 'draft');
      assert.equal(res.body.program.institution_id, instAId);
      assert.equal(res.body.program.consent_notice_version, 'v1.0');
      pilotProgramAId = res.body.program.id;
    });

    it('cross-tenant defense: college admin cannot create pilot program for another institution', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminAUser,
        body: {
          institution_id: instBId,
          name: `Malicious Program ${runId}`,
          code: `MALICIOUS_${runId}`,
          consent_notice_version: 'v1.0',
          consent_notice_text: 'Terms'
        }
      });

      await postCreateProgram(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Forbidden'));
    });

    it('super admin can create pilot program specifying target institution', async () => {
      const { req, res } = createMockReqRes({
        user: superAdminUser,
        body: {
          institution_id: instBId,
          name: `Horizon Campus AI Pilot ${runId}`,
          code: `HORIZON_AI_${runId}`,
          consent_notice_version: 'v1.0',
          consent_notice_text: 'Horizon voluntary consent terms'
        }
      });

      await postCreateProgram(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.program.institution_id, instBId);
      pilotProgramBId = res.body.program.id;
    });

    it('student is denied pilot administration access with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: { name: 'Student Program', code: 'STU_PROG', consent_notice_text: 'Text' }
      });

      await postCreateProgram(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
    });

    it('transitions pilot program lifecycle: draft -> active with audit logging', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminAUser,
        params: { id: pilotProgramAId },
        body: { status: 'active' }
      });

      await patchProgramStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.program.status, 'active');

      // Verify audit log entry
      const { rows: logs } = await db.query(
        `SELECT * FROM pilot_audit_logs WHERE pilot_program_id = $1 AND action = 'status_changed' ORDER BY created_at DESC`,
        [pilotProgramAId]
      );
      assert.ok(logs.length >= 1);
      assert.equal(logs[0].actor_user_id, collegeAdminAUser.id);
    });
  });

  describe('2. Student Voluntary Opt-In & Eligibility Validation', () => {
    it('rejects opt-in when pilot program is in draft status', async () => {
      // pilotProgramBId is still in 'draft'
      const { req, res } = createMockReqRes({
        user: studentBUser,
        body: {
          pilot_program_id: pilotProgramBId,
          consent_notice_version: 'v1.0'
        }
      });

      await postStudentConsent(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('draft'));
    });

    it('cross-tenant defense: student cannot enroll in pilot program of another institution (403 Forbidden)', async () => {
      // studentB belongs to Horizon (instB), attempting to enroll in Apex pilot (instA)
      const { req, res } = createMockReqRes({
        user: studentBUser,
        body: {
          pilot_program_id: pilotProgramAId,
          consent_notice_version: 'v1.0'
        }
      });

      await postStudentConsent(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Forbidden'));
      assert.ok(res.body.message.includes('registered institution'));
    });

    it('rejects opt-in when consent notice version does not match active version (400 Bad Request)', async () => {
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          pilot_program_id: pilotProgramAId,
          consent_notice_version: 'v0.9-outdated'
        }
      });

      await postStudentConsent(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('notice version mismatch'));
    });

    it('successfully opts in eligible student with voluntary consent and audit log', async () => {
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          pilot_program_id: pilotProgramAId,
          consent_notice_version: 'v1.0'
        }
      });

      await postStudentConsent(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.enrollment.status, 'active');
      assert.equal(res.body.enrollment.consent_status, 'opted_in');
      assert.ok(res.body.enrollment.consented_at);

      // Verify audit log
      const { rows: logs } = await db.query(
        `SELECT * FROM pilot_audit_logs WHERE pilot_program_id = $1 AND candidate_id = $2 AND action = 'student_opted_in'`,
        [pilotProgramAId, candA1Id]
      );
      assert.equal(logs.length, 1);
    });

    it('idempotent opt-in: re-consenting preserves active status and updates timestamp cleanly without duplicates', async () => {
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          pilot_program_id: pilotProgramAId,
          consent_notice_version: 'v1.0'
        }
      });

      await postStudentConsent(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);

      // Verify exactly 1 enrollment row in database
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*)::int as count FROM pilot_enrollments WHERE pilot_program_id = $1 AND candidate_id = $2`,
        [pilotProgramAId, candA1Id]
      );
      assert.equal(countRows[0].count, 1);
    });

    it('retrieves student pilot status showing active participation', async () => {
      const { req, res } = createMockReqRes({ user: studentA1User });
      await getStudentStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.is_pilot_participant, true);
      assert.equal(res.body.active_enrollment.pilot_program_id, pilotProgramAId);
      assert.equal(res.body.available_programs.length, 1);
    });
  });

  describe('3. Explicit Telemetry Provenance & Anti-Spoofing Defense', () => {
    it('automatically assigns "pilot" provenance to telemetry generated by opted-in student', async () => {
      const presId = `pres_pilot_test_${runId}`;
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          roadmap_id: roadmapA1Id,
          presentation_id: presId,
          impressions: [
            { recommendation_id: recA1Id, rank_position: 1, ranking_score: 0.95 }
          ]
        }
      });

      await postImpressions(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.provenance_tag, 'pilot');

      // Verify row in recommendation_impressions
      const { rows: impRows } = await db.query(
        `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1 AND recommendation_id = $2`,
        [presId, recA1Id]
      );
      assert.equal(impRows[0].provenance_tag, 'pilot');
    });

    it('anti-spoofing defense: non-enrolled student passing { provenance_tag: "pilot" } is ignored and tagged "unknown"', async () => {
      const presId = `pres_spoof_attempt_${runId}`;
      const { req, res } = createMockReqRes({
        user: nonParticipantUser,
        body: {
          roadmap_id: roadmapNonPartId,
          presentation_id: presId,
          impressions: [
            { recommendation_id: recNonPartId, rank_position: 1, ranking_score: 0.88 }
          ],
          provenance_tag: 'pilot' // Malicious client attempt to spoof pilot status
        }
      });

      await postImpressions(req, res);

      assert.equal(res.statusCode, 201);
      // Server must have rejected client's tag and resolved to 'unknown'
      assert.equal(res.body.provenance_tag, 'unknown');

      const { rows: impRows } = await db.query(
        `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1 AND recommendation_id = $2`,
        [presId, recNonPartId]
      );
      assert.equal(impRows[0].provenance_tag, 'unknown');
    });

    it('anti-spoofing on interaction and feedback endpoints: client provenance_tag is disregarded', async () => {
      // 1. Interaction spoofing attempt
      const { req: intReq, res: intRes } = createMockReqRes({
        user: nonParticipantUser,
        body: {
          recommendation_id: recNonPartId,
          event_type: 'opened',
          idempotency_key: `idemp_spoof_${runId}`,
          provenance_tag: 'pilot'
        }
      });
      await postInteraction(intReq, intRes);
      assert.equal(intRes.statusCode, 201);
      assert.equal(intRes.body.provenance_tag, 'unknown');

      // 2. Feedback spoofing attempt
      const { req: fbReq, res: fbRes } = createMockReqRes({
        user: nonParticipantUser,
        body: {
          recommendation_id: recNonPartId,
          rating: 4,
          reason_category: 'relevant_to_goal',
          provenance_tag: 'pilot'
        }
      });
      await postFeedback(fbReq, fbRes);
      assert.equal(fbRes.statusCode, 201);
      assert.equal(fbRes.body.provenance_tag, 'unknown');
    });
  });

  describe('4. Voluntary Withdrawal & Lifecycle Invariants', () => {
    it('allows opted-in student to voluntarily withdraw at any time', async () => {
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          pilot_program_id: pilotProgramAId,
          withdrawal_reason: 'Graduating early and focusing on capstone project'
        }
      });

      await postStudentWithdraw(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.enrollment.consent_status, 'withdrawn');
      assert.equal(res.body.enrollment.status, 'withdrawn');
      assert.ok(res.body.enrollment.withdrawn_at);
      assert.ok(res.body.enrollment.withdrawal_reason.includes('Graduating early'));

      // Verify audit log
      const { rows: logs } = await db.query(
        `SELECT * FROM pilot_audit_logs WHERE pilot_program_id = $1 AND candidate_id = $2 AND action = 'student_withdrawn'`,
        [pilotProgramAId, candA1Id]
      );
      assert.equal(logs.length, 1);
    });

    it('subsequent telemetry generated by withdrawn student is assigned "unknown" provenance', async () => {
      const tagAfterWithdrawal = await resolveProvenanceTag(candA1Id);
      assert.equal(tagAfterWithdrawal, 'unknown');

      // Interaction after withdrawal
      const { req, res } = createMockReqRes({
        user: studentA1User,
        body: {
          recommendation_id: recA1Id,
          event_type: 'started',
          idempotency_key: `idemp_after_withdraw_${runId}`
        }
      });

      await postInteraction(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.provenance_tag, 'unknown');
    });

    it('historical pilot records generated prior to withdrawal are preserved intact', async () => {
      const presId = `pres_pilot_test_${runId}`;
      const { rows } = await db.query(
        `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1 AND recommendation_id = $2`,
        [presId, recA1Id]
      );
      assert.equal(rows[0].provenance_tag, 'pilot');
    });

    it('non-participating student continues normal roadmap/learning workflow completely unimpeded', async () => {
      const { req: statusReq, res: statusRes } = createMockReqRes({ user: nonParticipantUser });
      await getStudentStatus(statusReq, statusRes);

      assert.equal(statusRes.statusCode, 200);
      assert.equal(statusRes.body.is_pilot_participant, false);
      assert.equal(statusRes.body.active_enrollment, null);

      // Student can interact with roadmaps normally
      const { req: intReq, res: intRes } = createMockReqRes({
        user: nonParticipantUser,
        body: {
          recommendation_id: recNonPartId,
          event_type: 'started',
          idempotency_key: `idemp_np_start_${runId}`
        }
      });
      await postInteraction(intReq, intRes);
      assert.equal(intRes.statusCode, 201);
    });
  });

  describe('5. Evaluation Reporting & Provenance Partitioning', () => {
    it('evaluation endpoint defaults to genuine "pilot" view and reports INSUFFICIENT_REAL_WORLD_DATA', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.provenance_filter, 'pilot');
      assert.equal(res.body.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
      assert.ok(res.body.status_notice.includes('below minimum threshold'));
    });

    it('returns pilot_participation summary in evaluation metrics', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getEvaluationReport(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(res.body.pilot_participation);
      const pp = res.body.pilot_participation;
      assert.ok(typeof pp.active_programs_count === 'number');
      assert.ok(typeof pp.enrolled_students_count === 'number');
      assert.ok(typeof pp.active_opted_in_students_count === 'number');
      assert.ok(typeof pp.withdrawn_students_count === 'number');
      assert.ok(pp.active_programs_count >= 1);
    });

    it('allows administrators to explicitly filter by partition (automated_test, demo_fixture, unknown, all)', async () => {
      // 1. Automated test partition
      const reportTests = await getEvaluationDataset({ provenanceFilter: 'automated_test' });
      assert.equal(reportTests.provenance_filter, 'automated_test');

      // 2. Demo fixture partition
      const reportDemo = await getEvaluationDataset({ provenanceFilter: 'demo_fixture' });
      assert.equal(reportDemo.provenance_filter, 'demo_fixture');

      // 3. Unknown partition
      const reportUnknown = await getEvaluationDataset({ provenanceFilter: 'unknown' });
      assert.equal(reportUnknown.provenance_filter, 'unknown');

      // 4. All partitions
      const reportAll = await getEvaluationDataset({ provenanceFilter: 'all' });
      assert.equal(reportAll.provenance_filter, 'all');
      assert.ok(reportAll.provenance_breakdown);
    });
  });

  after(async () => {
    // Clean up Phase 16 pilot test artifacts so repeatable full regression runs preserve 0 pilot baseline
    if (pilotProgramAId || pilotProgramBId) {
      await db.query(`DELETE FROM recommendation_impressions WHERE candidate_id IN ($1, $2, $3, $4)`, [candA1Id, candA2Id, candBId, candNonPartId]);
      await db.query(`DELETE FROM recommendation_interactions WHERE candidate_id IN ($1, $2, $3, $4)`, [candA1Id, candA2Id, candBId, candNonPartId]);
      await db.query(`DELETE FROM recommendation_feedback WHERE candidate_id IN ($1, $2, $3, $4)`, [candA1Id, candA2Id, candBId, candNonPartId]);
      await db.query(`DELETE FROM pilot_audit_logs WHERE pilot_program_id IN ($1, $2)`, [pilotProgramAId, pilotProgramBId]);
      await db.query(`DELETE FROM pilot_enrollments WHERE pilot_program_id IN ($1, $2)`, [pilotProgramAId, pilotProgramBId]);
      await db.query(`DELETE FROM pilot_programs WHERE id IN ($1, $2)`, [pilotProgramAId, pilotProgramBId]);
    }
  });
});
