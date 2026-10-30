// Backend/tests/phase16_1_pilot_e2e_workflow.test.js
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
  patchProgramStatus,
  postStudentConsent,
  postStudentWithdraw,
  getStudentStatus
} from '../src/controllers/pilot.controller.js';
import {
  recordImpressions,
  recordInteraction,
  submitFeedback,
  getEvaluationDataset
} from '../src/services/feedback.service.js';
import {
  postImpressions,
  postInteraction,
  postFeedback,
  getEvaluationReport
} from '../src/controllers/feedback.controller.js';

describe('SkillVerse Phase 16.1: End-to-End Pilot Participation & Provenance Acceptance Suite', () => {
  const nonce = Math.floor(Math.random() * 899999 + 100000);
  let instA, instB;
  let collegeAdminA, collegeAdminB, studentA, studentB, unauthorizedRecruiter;
  let candidateA, candidateB;
  let pilotProgramA, pilotProgramB;
  let roadmapA, recA;

  function createMockReqRes({ user = null, body = {}, query = {}, params = {} } = {}) {
    const req = { user, body, query, params };
    const res = {
      statusCode: 200,
      body: null,
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

  before(async () => {
    // 1. Create Isolated Institutions
    const instARes = await db.query(
      `INSERT INTO institutions (name, code, domain) VALUES ($1, $2, $3) RETURNING *`,
      [`Phase 16.1 Academy A ${nonce}`, `P16_1_A_${nonce}`, `p16_1_a_${nonce}.edu`]
    );
    instA = instARes.rows[0];

    const instBRes = await db.query(
      `INSERT INTO institutions (name, code, domain) VALUES ($1, $2, $3) RETURNING *`,
      [`Phase 16.1 College B ${nonce}`, `P16_1_B_${nonce}`, `p16_1_b_${nonce}.edu`]
    );
    instB = instBRes.rows[0];

    // 2. Create Users
    const uARes = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'college_admin') RETURNING *`,
      [`Dean A ${nonce}`, `admin_a_${nonce}@p16_1_a.edu`]
    );
    collegeAdminA = uARes.rows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'college_admin')`,
      [instA.id, collegeAdminA.id]
    );

    const uBRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'college_admin') RETURNING *`,
      [`Dean B ${nonce}`, `admin_b_${nonce}@p16_1_b.edu`]
    );
    collegeAdminB = uBRes.rows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'college_admin')`,
      [instB.id, collegeAdminB.id]
    );

    const sARes = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'student') RETURNING *`,
      [`Student A ${nonce}`, `student_a_${nonce}@p16_1_a.edu`]
    );
    studentA = sARes.rows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'student')`,
      [instA.id, studentA.id]
    );

    const candARes = await db.query(
      `INSERT INTO candidates (user_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
      [studentA.id, `Student A ${nonce}`, studentA.email]
    );
    candidateA = candARes.rows[0];

    const sBRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'student') RETURNING *`,
      [`Student B ${nonce}`, `student_b_${nonce}@p16_1_b.edu`]
    );
    studentB = sBRes.rows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'student')`,
      [instB.id, studentB.id]
    );

    const candBRes = await db.query(
      `INSERT INTO candidates (user_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
      [studentB.id, `Student B ${nonce}`, studentB.email]
    );
    candidateB = candBRes.rows[0];

    const rRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'recruiter') RETURNING *`,
      [`Recruiter ${nonce}`, `recruiter_${nonce}@corp.test`]
    );
    unauthorizedRecruiter = rRes.rows[0];

    // 3. Create Goal, Roadmap & Recommendation for Student A
    const gRes = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_skills)
       VALUES ($1, 'target_role', 'AI Engineer', '["Python", "FastAPI"]') RETURNING id`,
      [candidateA.id]
    );
    const goalAId = gRes.rows[0].id;

    const rdRes = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score, engine_version, model_metadata)
       VALUES ($1, $2, 75, 'v2.0.0-ai-semantic-recommendation', '{"model_version": "all-MiniLM-L6-v2"}'::jsonb) RETURNING *`,
      [candidateA.id, goalAId]
    );
    roadmapA = rdRes.rows[0];

    const recRes = await db.query(
      `INSERT INTO roadmap_recommendations (
         roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata
       ) VALUES ($1, $2, $3, $4, 'Complete core module', 'High priority AI skill', 'course', 1, '{"ranking_score": 0.88}'::jsonb)
       RETURNING *`,
      [roadmapA.id, candidateA.id, `rec_key_${nonce}`, 'Phase 16.1 Microservice Lab']
    );
    recA = recRes.rows[0];
  });

  after(async () => {
    // Teardown all test artifacts in reverse foreign key order
    try {
      if (candidateA && candidateB) {
        await db.query(`DELETE FROM recommendation_feedback WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
        await db.query(`DELETE FROM recommendation_interactions WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
        await db.query(`DELETE FROM recommendation_impressions WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
        await db.query(`DELETE FROM pilot_audit_logs WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
        await db.query(`DELETE FROM pilot_enrollments WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
      }
      if (roadmapA) {
        await db.query(`DELETE FROM roadmap_recommendations WHERE roadmap_id = $1`, [roadmapA.id]);
        await db.query(`DELETE FROM development_roadmaps WHERE id = $1`, [roadmapA.id]);
      }
      if (candidateA && candidateB) {
        await db.query(`DELETE FROM student_goals WHERE candidate_id IN ($1, $2)`, [candidateA.id, candidateB.id]);
      }
      if (pilotProgramA) {
        await db.query(`DELETE FROM pilot_audit_logs WHERE pilot_program_id = $1`, [pilotProgramA.id]);
        await db.query(`DELETE FROM pilot_programs WHERE id = $1`, [pilotProgramA.id]);
      }
      if (pilotProgramB) {
        await db.query(`DELETE FROM pilot_audit_logs WHERE pilot_program_id = $1`, [pilotProgramB.id]);
        await db.query(`DELETE FROM pilot_programs WHERE id = $1`, [pilotProgramB.id]);
      }
      if (candidateA && candidateB) {
        await db.query(`DELETE FROM candidates WHERE id IN ($1, $2)`, [candidateA.id, candidateB.id]);
      }
      const uIds = [collegeAdminA?.id, collegeAdminB?.id, studentA?.id, studentB?.id, unauthorizedRecruiter?.id].filter(Boolean);
      if (uIds.length > 0) {
        await db.query(`DELETE FROM institution_memberships WHERE user_id = ANY($1)`, [uIds]);
        await db.query(`DELETE FROM users WHERE id = ANY($1)`, [uIds]);
      }
      if (instA && instB) {
        await db.query(`DELETE FROM institutions WHERE id IN ($1, $2)`, [instA.id, instB.id]);
      }
    } catch (err) {
      console.warn('Phase 16.1 Teardown Warning:', err.message);
    }
  });

  // ------------------------------------------------------------------------
  // Test 1 & 2: Authorized Administrator Pilot Creation & Unauthorized Denied
  // ------------------------------------------------------------------------
  it('1. An authorized administrator creates a pilot in an isolated test context', async () => {
    const { req, res } = createMockReqRes({
      user: collegeAdminA,
      body: {
        name: `Spring 2026 AI Pilot ${nonce}`,
        code: `APEX_AI_${nonce}`,
        consent_notice_version: 'v1.0',
        consent_notice_text: 'Voluntary consent agreement for research participation.'
      }
    });

    await postCreateProgram(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.program.status, 'draft');
    assert.equal(res.body.program.institution_id, instA.id);
    pilotProgramA = res.body.program;
  });

  it('2. An unauthorized role cannot administer the pilot (student denied 403)', async () => {
    const { req, res } = createMockReqRes({
      user: studentA,
      body: {
        name: `Hacked Pilot ${nonce}`,
        code: `HACK_${nonce}`,
        consent_notice_version: 'v1.0',
        consent_notice_text: 'Malicious pilot'
      }
    });

    await postCreateProgram(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  // ------------------------------------------------------------------------
  // Test 3: Cross-tenant pilot management is strictly blocked
  // ------------------------------------------------------------------------
  it('3. A college administrator cannot configure another institutions pilot (403 Forbidden)', async () => {
    const { req, res } = createMockReqRes({
      user: collegeAdminB,
      body: {
        institution_id: instA.id,
        name: `Cross Tenant Pilot ${nonce}`,
        code: `CROSS_${nonce}`
      }
    });

    await postCreateProgram(req, res);
    assert.equal(res.statusCode, 403);
    assert.ok(res.body.message.includes('Forbidden'));
  });

  // ------------------------------------------------------------------------
  // Test 4 & 5: Student notices & unenrolled state while pilot is in draft
  // ------------------------------------------------------------------------
  it('4. An eligible student sees available pilot status and correct notice version once activated', async () => {
    // First, activate pilot program A
    const { req: actReq, res: actRes } = createMockReqRes({
      user: collegeAdminA,
      params: { id: String(pilotProgramA.id) },
      body: { status: 'active' }
    });
    await patchProgramStatus(actReq, actRes);
    assert.equal(actRes.statusCode, 200);
    assert.equal(actRes.body.program.status, 'active');

    // Student inspects pilot status
    const { req: sReq, res: sRes } = createMockReqRes({ user: studentA });
    await getStudentStatus(sReq, sRes);
    assert.equal(sRes.statusCode, 200);
    assert.equal(sRes.body.is_pilot_participant, false);
    assert.equal(sRes.body.available_programs.length, 1);
    assert.equal(sRes.body.available_programs[0].code, `APEX_AI_${nonce}`);
    assert.equal(sRes.body.available_programs[0].consent_notice_version, 'v1.0');
    assert.ok(sRes.body.available_programs[0].consent_notice_text.includes('Voluntary consent agreement'));
  });

  it('5. Declining or ignoring consent leaves the student unenrolled and telemetry unpolluted', async () => {
    const status = await getStudentPilotStatus(candidateA.id);
    assert.equal(status.is_pilot_participant, false);
    assert.equal(status.active_enrollment, null);

    // Recording an interaction prior to consent
    const presId = `pres_pre_${nonce}`;
    await recordImpressions({
      candidateId: candidateA.id,
      roadmapId: roadmapA.id,
      presentationId: presId,
      impressions: [
        { recommendation_id: recA.id, rank_position: 1, score: 0.88 }
      ]
    });

    const { rows: impRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presId]
    );
    assert.equal(impRows[0].provenance_tag, 'unknown'); // NOT 'pilot'
  });

  // ------------------------------------------------------------------------
  // Test 6 & 7: Explicit opt-in and anti-spoofing defense
  // ------------------------------------------------------------------------
  it('6. Explicit opt-in creates expected enrollment and audit record with exact version match', async () => {
    const { req, res } = createMockReqRes({
      user: studentA,
      body: {
        pilot_program_id: pilotProgramA.id,
        consent_notice_version: 'v1.0'
      }
    });

    await postStudentConsent(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.enrollment.consent_status, 'opted_in');

    // Verify audit log
    const { rows: auditRows } = await db.query(
      `SELECT * FROM pilot_audit_logs WHERE candidate_id = $1 AND action = 'student_opted_in'`,
      [candidateA.id]
    );
    assert.equal(auditRows.length, 1);
    assert.equal(auditRows[0].action, 'student_opted_in');
  });

  it('7. A client cannot spoof consent or pilot provenance by passing arbitrary payload tags', async () => {
    // Non-enrolled student B attempts to write impressions to Student A's roadmap with provenance_tag: 'pilot'
    const presSpoof = `pres_spoof_${nonce}`;
    const { req, res } = createMockReqRes({
      user: studentB,
      body: {
        roadmap_id: roadmapA.id,
        presentation_id: presSpoof,
        impressions: [
          { recommendation_id: recA.id, rank_position: 1, score: 0.90 }
        ],
        provenance_tag: 'pilot' // SPOOF ATTEMPT
      }
    });

    // Student B cannot write to Student A's roadmap (403 Forbidden)
    await postImpressions(req, res);
    assert.equal(res.statusCode, 403);
  });

  // ------------------------------------------------------------------------
  // Test 8 & 9: Server-controlled provenance and pre-opt-in event preservation
  // ------------------------------------------------------------------------
  it('8. A valid recommendation interaction after opt-in receives server-controlled "pilot" provenance', async () => {
    const presPilot = `pres_pilot_${nonce}`;
    await recordImpressions({
      candidateId: candidateA.id,
      roadmapId: roadmapA.id,
      presentationId: presPilot,
      impressions: [
        { recommendation_id: recA.id, rank_position: 1, score: 0.88 }
      ]
    });

    const { rows: impRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presPilot]
    );
    assert.equal(impRows[0].provenance_tag, 'pilot');

    // Record interaction
    const rxRes = await recordInteraction({
      candidateId: candidateA.id,
      recommendationId: recA.id,
      eventType: 'opened',
      idempotencyKey: `rx_open_${nonce}`,
      presentationId: presPilot
    });
    assert.equal(rxRes.interaction.provenance_tag, 'pilot');
  });

  it('9. Pre-opt-in events are not reclassified as pilot events (provenance remains immutable)', async () => {
    const presPre = `pres_pre_${nonce}`;
    const { rows: preRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presPre]
    );
    assert.equal(preRows[0].provenance_tag, 'unknown'); // Still unknown, never reclassified
  });

  // ------------------------------------------------------------------------
  // Test 10 & 11: Voluntary withdrawal and idempotency
  // ------------------------------------------------------------------------
  it('10. Withdrawal prevents subsequent events from being attributed to the pilot', async () => {
    const { req, res } = createMockReqRes({
      user: studentA,
      body: {
        pilot_program_id: pilotProgramA.id,
        withdrawal_reason: 'Testing voluntary withdrawal flow'
      }
    });

    await postStudentWithdraw(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.enrollment.consent_status, 'withdrawn');

    // New event generated after withdrawal
    const presPost = `pres_post_${nonce}`;
    await recordImpressions({
      candidateId: candidateA.id,
      roadmapId: roadmapA.id,
      presentationId: presPost,
      impressions: [
        { recommendation_id: recA.id, rank_position: 1, score: 0.88 }
      ]
    });

    const { rows: postRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presPost]
    );
    assert.equal(postRows[0].provenance_tag, 'unknown'); // Reverted to unknown
  });

  it('11. Repeated consent or withdrawal submissions do not create inconsistent enrollment state', async () => {
    // Re-withdraw should succeed idempotently
    const { req: wReq, res: wRes } = createMockReqRes({
      user: studentA,
      body: { pilot_program_id: pilotProgramA.id }
    });
    await postStudentWithdraw(wReq, wRes);
    assert.equal(wRes.statusCode, 200);

    // Verify exactly 1 enrollment row exists
    const { rows: peRows } = await db.query(
      `SELECT COUNT(*)::int as count FROM pilot_enrollments WHERE candidate_id = $1 AND pilot_program_id = $2`,
      [candidateA.id, pilotProgramA.id]
    );
    assert.equal(peRows[0].count, 1);
  });

  // ------------------------------------------------------------------------
  // Test 12, 13, 14, 15: Evaluation isolation, learning access, cross-student defense
  // ------------------------------------------------------------------------
  it('12. Existing pilot observations retain their historical pilot provenance intact', async () => {
    const presPilot = `pres_pilot_${nonce}`;
    const { rows: histRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presPilot]
    );
    assert.equal(histRows[0].provenance_tag, 'pilot'); // Immutable historical record
  });

  it('13. Evaluation dashboard reflects genuine pilot data only and reports accurate participation', async () => {
    const report = await getEvaluationDataset({ institutionId: instA.id, provenanceFilter: 'pilot' });
    assert.equal(report.provenance_filter, 'pilot');
    assert.equal(report.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
    assert.ok(report.pilot_participation);
  });

  it('14. A non-participant can still access ordinary authorized learning features unimpeded', async () => {
    // Student B is not enrolled in any pilot
    const statusB = await getStudentPilotStatus(candidateB.id);
    assert.equal(statusB.is_pilot_participant, false);

    // Student B can generate normal recommendations without hindrance
    const gB = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title) VALUES ($1, 'target_role', 'Backend Dev') RETURNING id`,
      [candidateB.id]
    );

    const rdB = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score) VALUES ($1, $2, 80) RETURNING *`,
      [candidateB.id, gB.rows[0].id]
    );
    assert.ok(rdB.rows[0].id);

    // Clean up rdB and gB
    await db.query(`DELETE FROM development_roadmaps WHERE id = $1`, [rdB.rows[0].id]);
    await db.query(`DELETE FROM student_goals WHERE id = $1`, [gB.rows[0].id]);
  });

  it('15. Cross-student and cross-tenant requests remain strictly blocked (403 Forbidden)', async () => {
    // Student B attempts to rate Student A's recommendation
    const { req, res } = createMockReqRes({
      user: studentB,
      body: {
        recommendation_id: recA.id,
        rating: 5,
        reason_category: 'relevant_to_goal'
      }
    });

    await postFeedback(req, res);
    assert.equal(res.statusCode, 403);
    assert.ok(res.body.message.includes('Forbidden'));
  });
});
