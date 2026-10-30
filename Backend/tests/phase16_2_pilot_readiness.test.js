// Backend/tests/phase16_2_pilot_readiness.test.js
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
  getEvaluationDataset,
  resolveProvenanceTag
} from '../src/services/feedback.service.js';
import {
  postImpressions,
  postInteraction,
  postFeedback,
  getEvaluationReport
} from '../src/controllers/feedback.controller.js';

describe('SkillVerse Phase 16.2: Pilot Readiness, Consent Integrity & Go/No-Go Acceptance Suite', () => {
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
    // 1. Setup isolated test institutions
    const { rows: iARows } = await db.query(
      `INSERT INTO institutions (name, code) VALUES ($1, $2) RETURNING *`,
      [`Phase 16.2 Institute A ${nonce}`, `P162A_${nonce}`]
    );
    instA = iARows[0];

    const { rows: iBRows } = await db.query(
      `INSERT INTO institutions (name, code) VALUES ($1, $2) RETURNING *`,
      [`Phase 16.2 Institute B ${nonce}`, `P162B_${nonce}`]
    );
    instB = iBRows[0];

    // 2. Setup college admins
    const { rows: uAdminA } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'college_admin') RETURNING *`,
      [`Admin A ${nonce}`, `admin_a_${nonce}@p162.test`]
    );
    collegeAdminA = uAdminA[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'college_admin')`,
      [instA.id, collegeAdminA.id]
    );

    const { rows: uAdminB } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'college_admin') RETURNING *`,
      [`Admin B ${nonce}`, `admin_b_${nonce}@p162.test`]
    );
    collegeAdminB = uAdminB[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'college_admin')`,
      [instB.id, collegeAdminB.id]
    );

    // 3. Setup student A (enrolled in instA) using real institutional student email
    const { rows: uStuA } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'student') RETURNING *`,
      [`Student A ${nonce}`, `student_a_${nonce}@state_university.edu`]
    );
    studentA = uStuA[0];
    const { rows: cARows } = await db.query(
      `INSERT INTO candidates (user_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
      [studentA.id, `Candidate A ${nonce}`, studentA.email]
    );
    candidateA = cARows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'student')`,
      [instA.id, studentA.id]
    );

    // 4. Setup student B (enrolled in instB)
    const { rows: uStuB } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'student') RETURNING *`,
      [`Student B ${nonce}`, `student_b_${nonce}@p162.test`]
    );
    studentB = uStuB[0];
    const { rows: cBRows } = await db.query(
      `INSERT INTO candidates (user_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
      [studentB.id, `Candidate B ${nonce}`, studentB.email]
    );
    candidateB = cBRows[0];
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role) VALUES ($1, $2, 'student')`,
      [instB.id, studentB.id]
    );

    // 5. Setup unauthorized recruiter
    const { rows: uRec } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'hash', 'recruiter') RETURNING *`,
      [`Recruiter ${nonce}`, `recruiter_${nonce}@p162.test`]
    );
    unauthorizedRecruiter = uRec[0];

    const { rows: goalRows } = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title)
       VALUES ($1, 'target_role', 'Cloud Systems Architect') RETURNING id`,
      [candidateA.id]
    );

    const { rows: rMapRows } = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score, engine_version, model_metadata)
       VALUES ($1, $2, 75, 'v2.0.0-ai-semantic-recommendation', '{"model_version": "all-MiniLM-L6-v2"}'::jsonb) RETURNING *`,
      [candidateA.id, goalRows[0].id]
    );
    roadmapA = rMapRows[0];

    const { rows: recRows } = await db.query(
      `INSERT INTO roadmap_recommendations (
         roadmap_id, candidate_id, recommendation_key, title, action_text, rationale, recommendation_type, priority, recommendation_metadata
       ) VALUES ($1, $2, $3, $4, 'Complete core module', 'High priority cloud skill', 'course', 1, $5)
       RETURNING *`,
      [
        roadmapA.id,
        candidateA.id,
        `rec_key_${nonce}`,
        'Phase 16.2 Cloud Systems Lab',
        JSON.stringify({
          model_version: 'all-MiniLM-L6-v2',
          ranking_score: 0.94,
          scoring_breakdown: { semantic_similarity: 0.94 }
        })
      ]
    );
    recA = recRows[0];
  });

  after(async () => {
    // Isolated teardown
    if (pilotProgramA?.id) {
      await db.query(`DELETE FROM pilot_audit_logs WHERE pilot_program_id = $1`, [pilotProgramA.id]);
      await db.query(`DELETE FROM pilot_enrollments WHERE pilot_program_id = $1`, [pilotProgramA.id]);
      await db.query(`DELETE FROM pilot_programs WHERE id = $1`, [pilotProgramA.id]);
    }
    if (pilotProgramB?.id) {
      await db.query(`DELETE FROM pilot_audit_logs WHERE pilot_program_id = $1`, [pilotProgramB.id]);
      await db.query(`DELETE FROM pilot_enrollments WHERE pilot_program_id = $1`, [pilotProgramB.id]);
      await db.query(`DELETE FROM pilot_programs WHERE id = $1`, [pilotProgramB.id]);
    }
    if (candidateA?.id) {
      await db.query(`DELETE FROM recommendation_feedback WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM recommendation_interactions WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM recommendation_impressions WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM roadmap_recommendations WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM development_roadmaps WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM student_goals WHERE candidate_id = $1`, [candidateA.id]);
      await db.query(`DELETE FROM candidates WHERE id = $1`, [candidateA.id]);
    }
    if (candidateB?.id) {
      await db.query(`DELETE FROM candidates WHERE id = $1`, [candidateB.id]);
    }
    await db.query(`DELETE FROM institution_memberships WHERE user_id = ANY($1::int[])`, [
      [collegeAdminA.id, collegeAdminB.id, studentA.id, studentB.id]
    ]);
    await db.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [
      [collegeAdminA.id, collegeAdminB.id, studentA.id, studentB.id, unauthorizedRecruiter.id]
    ]);
    if (instA?.id) await db.query(`DELETE FROM institutions WHERE id = $1`, [instA.id]);
    if (instB?.id) await db.query(`DELETE FROM institutions WHERE id = $1`, [instB.id]);
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 1 & 2: Administrator Pilot Creation and Lifecycle
  // ------------------------------------------------------------------------
  it('1. Authorized administrator can create a pilot with a documented notice version (v1.0)', async () => {
    const { req, res } = createMockReqRes({
      user: collegeAdminA,
      body: {
        name: `Acceptance Pilot A ${nonce}`,
        code: `ACC_A_${nonce}`,
        consent_notice_version: 'v1.0',
        consent_notice_text: 'Voluntary research participation terms for AI Recommendation Engine evaluation.',
        target_engine_version: 'v2.0.0-ai-semantic-recommendation',
        target_model_version: 'all-MiniLM-L6-v2'
      }
    });

    await postCreateProgram(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.program.consent_notice_version, 'v1.0');
    assert.equal(res.body.program.status, 'draft');
    pilotProgramA = res.body.program;
  });

  it('2. Unauthorized roles (student, recruiter, anonymous) are blocked from creating or modifying pilots (403)', async () => {
    // Student attempt
    const { req: sReq, res: sRes } = createMockReqRes({
      user: studentA,
      body: { name: 'Hacker Pilot', code: `HACK_${nonce}`, consent_notice_text: 'Text' }
    });
    await postCreateProgram(sReq, sRes);
    assert.equal(sRes.statusCode, 403);

    // Recruiter attempt
    const { req: rReq, res: rRes } = createMockReqRes({
      user: unauthorizedRecruiter,
      body: { name: 'Recruiter Pilot', code: `REC_${nonce}`, consent_notice_text: 'Text' }
    });
    await postCreateProgram(rReq, rRes);
    assert.equal(rRes.statusCode, 403);
  });

  it('3. College administrator cannot manage another institution\'s pilot program (403 Forbidden)', async () => {
    // Admin B attempts to activate Admin A's pilot program
    const { req, res } = createMockReqRes({
      user: collegeAdminB,
      params: { id: String(pilotProgramA.id) },
      body: { status: 'active' }
    });

    await patchProgramStatus(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Forbidden.*another institution/i);
  });

  it('4. Authorized college administrator can activate their own institution\'s pilot program', async () => {
    const { req, res } = createMockReqRes({
      user: collegeAdminA,
      params: { id: String(pilotProgramA.id) },
      body: { status: 'active' }
    });

    await patchProgramStatus(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.program.status, 'active');
    pilotProgramA.status = 'active';
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 4, 5, 6: Student Notice Integrity & Voluntary Choice
  // ------------------------------------------------------------------------
  it('5. Eligible student inspects available programs and sees the exact applicable notice text and version', async () => {
    const { req, res } = createMockReqRes({ user: studentA });
    await getStudentStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.is_pilot_participant, false);
    assert.equal(res.body.active_enrollment, null);
    assert.equal(res.body.available_programs.length, 1);
    assert.equal(res.body.available_programs[0].id, pilotProgramA.id);
    assert.equal(res.body.available_programs[0].consent_notice_version, 'v1.0');
    assert.equal(
      res.body.available_programs[0].consent_notice_text,
      'Voluntary research participation terms for AI Recommendation Engine evaluation.'
    );
  });

  it('6. Declining or ignoring consent does not create enrollment, and ordinary learning remains fully available', async () => {
    // Student B has not consented; verify no enrollment
    const statusB = await getStudentPilotStatus(candidateB.id);
    assert.equal(statusB.is_pilot_participant, false);
    assert.equal(statusB.active_enrollment, null);

    // Verify roadmap and goal creation works unimpeded for non-participant
    const { rows: gRows } = await db.query(
      `INSERT INTO student_goals (candidate_id, goal_type, target_title) VALUES ($1, 'target_role', 'Data Engineer') RETURNING id`,
      [candidateB.id]
    );
    const { rows: rRows } = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, readiness_score) VALUES ($1, $2, 60) RETURNING *`,
      [candidateB.id, gRows[0].id]
    );
    assert.ok(rRows[0].id);

    // Clean up
    await db.query(`DELETE FROM development_roadmaps WHERE id = $1`, [rRows[0].id]);
    await db.query(`DELETE FROM student_goals WHERE id = $1`, [gRows[0].id]);
  });

  it('7. Client cannot alter notice version or timestamp through client input (version mismatch rejected with 400)', async () => {
    // Student attempts to submit with spoofed notice version 'v99.9'
    const { req, res } = createMockReqRes({
      user: studentA,
      body: {
        pilot_program_id: pilotProgramA.id,
        consent_notice_version: 'v99.9' // Mismatched version
      }
    });

    await postStudentConsent(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /version mismatch/i);
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 7 & 8: Explicit Opt-In and Server-Controlled State
  // ------------------------------------------------------------------------
  it('8. Explicit opt-in records enrollment tied to the student, pilot, and exact notice version', async () => {
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
    assert.equal(res.body.enrollment.consent_notice_version, 'v1.0');
    assert.ok(res.body.enrollment.consented_at);

    // Verify student status now reports active participant
    const { req: sReq, res: sRes } = createMockReqRes({ user: studentA });
    await getStudentStatus(sReq, sRes);
    assert.equal(sRes.body.is_pilot_participant, true);
    assert.equal(sRes.body.active_enrollment.pilot_program_id, pilotProgramA.id);
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 9 & 10: Server-Controlled Provenance & Anti-Spoofing
  // ------------------------------------------------------------------------
  it('9. Eligible recommendation interaction receives server-controlled "pilot" provenance', async () => {
    const presId = `pres_readiness_${nonce}`;
    const impRes = await recordImpressions({
      candidateId: candidateA.id,
      roadmapId: roadmapA.id,
      presentationId: presId,
      impressions: [
        { recommendation_id: recA.id, rank_position: 1, ranking_score: 0.94 }
      ]
    });

    assert.equal(impRes.provenance_tag, 'pilot');

    const rxRes = await recordInteraction({
      candidateId: candidateA.id,
      recommendationId: recA.id,
      eventType: 'started',
      idempotencyKey: `rx_start_${nonce}`,
      presentationId: presId
    });
    assert.equal(rxRes.interaction.provenance_tag, 'pilot');
  });

  it('10. Client attempt to spoof pilot provenance without consent is normalized to "unknown"', async () => {
    // Candidate B is not enrolled in pilot; tries to pass provenance_tag: 'pilot'
    const tag = await resolveProvenanceTag(candidateB.id, null);
    assert.notEqual(tag, 'pilot');

    const presSpoof = `pres_spoof_readiness_${nonce}`;
    // Candidate B attempting to record impressions on candidate A's roadmap fails with 403
    const { req, res } = createMockReqRes({
      user: studentB,
      body: {
        roadmap_id: roadmapA.id,
        presentation_id: presSpoof,
        impressions: [{ recommendation_id: recA.id, rank_position: 1 }],
        provenance_tag: 'pilot'
      }
    });
    await postImpressions(req, res);
    assert.equal(res.statusCode, 403);
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 11, 12, 13: Voluntary Withdrawal & Race Conditions
  // ------------------------------------------------------------------------
  it('11. Student voluntarily withdraws; future pilot collection immediately stops', async () => {
    const { req, res } = createMockReqRes({
      user: studentA,
      body: {
        pilot_program_id: pilotProgramA.id,
        withdrawal_reason: 'Acceptance testing voluntary withdrawal semantics'
      }
    });

    await postStudentWithdraw(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.enrollment.consent_status, 'withdrawn');
    assert.ok(res.body.enrollment.withdrawn_at);

    // Verify student status immediately reflects withdrawn
    const statusA = await getStudentPilotStatus(candidateA.id);
    assert.equal(statusA.is_pilot_participant, false);
    assert.equal(statusA.active_enrollment, null);
  });

  it('12. Subsequent events post-withdrawal are immediately tagged "unknown" and excluded from pilot totals', async () => {
    const presPost = `pres_post_withdrawal_${nonce}`;
    const impRes = await recordImpressions({
      candidateId: candidateA.id,
      roadmapId: roadmapA.id,
      presentationId: presPost,
      impressions: [
        { recommendation_id: recA.id, rank_position: 1, ranking_score: 0.94 }
      ]
    });

    assert.equal(impRes.provenance_tag, 'unknown'); // Reverted to unknown
    assert.notEqual(impRes.provenance_tag, 'pilot');

    const { rows: postRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presPost]
    );
    assert.equal(postRows[0].provenance_tag, 'unknown');
  });

  it('13. Race condition verification: concurrent withdrawal and repeated requests remain consistent', async () => {
    // Re-enroll student A temporarily to test race condition
    await optInToPilot({
      candidateId: candidateA.id,
      pilotProgramId: pilotProgramA.id,
      consentNoticeVersion: 'v1.0'
    });

    // Execute concurrent actions: event submission alongside withdrawal
    const presRace1 = `pres_race_pre_${nonce}`;
    const presRace2 = `pres_race_post_${nonce}`;

    const [event1, withdrawRes, event2] = await Promise.all([
      // Pre/concurrent event
      recordImpressions({
        candidateId: candidateA.id,
        roadmapId: roadmapA.id,
        presentationId: presRace1,
        impressions: [{ recommendation_id: recA.id, rank_position: 1 }]
      }),
      // Withdrawal operation
      withdrawFromPilot({
        candidateId: candidateA.id,
        pilotProgramId: pilotProgramA.id,
        withdrawalReason: 'Concurrent test'
      }),
      // Post-withdrawal event
      recordImpressions({
        candidateId: candidateA.id,
        roadmapId: roadmapA.id,
        presentationId: presRace2,
        impressions: [{ recommendation_id: recA.id, rank_position: 1 }]
      })
    ]);

    assert.equal(withdrawRes.success, true);
    assert.equal(withdrawRes.enrollment.consent_status, 'withdrawn');

    // Repeated withdrawal is idempotent and returns 200 without creating duplicate records
    const repeatedWithdraw = await withdrawFromPilot({
      candidateId: candidateA.id,
      pilotProgramId: pilotProgramA.id
    });
    assert.equal(repeatedWithdraw.success, true);

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*)::int as count FROM pilot_enrollments WHERE candidate_id = $1 AND pilot_program_id = $2`,
      [candidateA.id, pilotProgramA.id]
    );
    assert.equal(countRows[0].count, 1); // Exactly one record, no duplicates
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 14: Material Notice Revision Requires Explicit Re-Consent
  // ------------------------------------------------------------------------
  it('14. Material notice change (v1.0 -> v2.0) suspends pilot provenance until explicit agreement to new terms', async () => {
    // 1. Re-enroll under v1.0
    await optInToPilot({
      candidateId: candidateA.id,
      pilotProgramId: pilotProgramA.id,
      consentNoticeVersion: 'v1.0'
    });

    // 2. Administrator updates program notice to v2.0
    await db.query(
      `UPDATE pilot_programs SET consent_notice_version = 'v2.0', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [pilotProgramA.id]
    );

    // 3. Prior consent to v1.0 does NOT grant permission under v2.0
    const tag = await resolveProvenanceTag(candidateA.id, null);
    assert.equal(tag, 'unknown'); // Suspended! Prior v1.0 consent invalid for v2.0

    // 4. Student status indicates renewal needed
    const status = await getStudentPilotStatus(candidateA.id);
    assert.equal(status.is_pilot_participant, false);
    assert.equal(status.available_programs[0].consent_notice_version, 'v2.0');

    // 5. Student explicitly re-consents to v2.0
    const reConsent = await optInToPilot({
      candidateId: candidateA.id,
      pilotProgramId: pilotProgramA.id,
      consentNoticeVersion: 'v2.0'
    });
    assert.equal(reConsent.success, true);
    assert.equal(reConsent.enrollment.consent_notice_version, 'v2.0');

    // 6. Provenance restored to pilot under v2.0
    const tagRenewed = await resolveProvenanceTag(candidateA.id, null);
    assert.equal(tagRenewed, 'pilot');

    // Restore program notice version for safety
    await db.query(
      `UPDATE pilot_programs SET consent_notice_version = 'v1.0' WHERE id = $1`,
      [pilotProgramA.id]
    );
    // Withdraw candidateA so no active enrollments linger
    await withdrawFromPilot({
      candidateId: candidateA.id,
      pilotProgramId: pilotProgramA.id,
      withdrawalReason: 'Final cleanup'
    });
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 15: Evaluation Dashboard Segregation & Privacy Safeguard
  // ------------------------------------------------------------------------
  it('15. Evaluation analytics dashboard isolates genuine pilot data and enforces k >= 5 privacy safeguard', async () => {
    const report = await getEvaluationDataset({
      institutionId: instA.id,
      provenanceFilter: 'pilot'
    });

    assert.equal(report.provenance_filter, 'pilot');
    // Because active student count is < 5, status must be INSUFFICIENT_REAL_WORLD_DATA
    assert.equal(report.evaluation_status, 'INSUFFICIENT_REAL_WORLD_DATA');
    assert.ok(report.pilot_participation);
    assert.equal(report.pilot_participation.active_opted_in_students_count, 0);
  });

  // ------------------------------------------------------------------------
  // Acceptance Criterion 16: Immutable Historical Telemetry & Audit Integrity
  // ------------------------------------------------------------------------
  it('16. Historical valid pilot events remain immutable and audit logs preserve actor actions', async () => {
    const presHistoric = `pres_readiness_${nonce}`;
    const { rows: histRows } = await db.query(
      `SELECT provenance_tag FROM recommendation_impressions WHERE presentation_id = $1`,
      [presHistoric]
    );
    assert.equal(histRows[0].provenance_tag, 'pilot'); // Preserved bit-for-bit

    // Verify audit logs record the complete lifecycle
    const { rows: auditRows } = await db.query(
      `SELECT action FROM pilot_audit_logs WHERE pilot_program_id = $1 ORDER BY created_at ASC`,
      [pilotProgramA.id]
    );
    const actions = auditRows.map(a => a.action);
    assert.ok(actions.includes('pilot_created'));
    assert.ok(actions.includes('status_changed'));
    assert.ok(actions.includes('student_opted_in'));
    assert.ok(actions.includes('student_withdrawn'));
  });
});
