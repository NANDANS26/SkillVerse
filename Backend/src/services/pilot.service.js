// Backend/src/services/pilot.service.js
import { db } from '../config/db.js';

const VALID_PILOT_STATUSES = ['draft', 'active', 'concluded', 'archived'];

/**
 * Create a new tenant-scoped pilot program
 * Access restricted to authorized administrators (super_admin or college_admin for their tenant)
 */
export async function createPilotProgram({
  institutionId,
  name,
  code,
  targetEngineVersion = 'v2.0.0-ai-semantic-recommendation',
  targetModelVersion = 'all-MiniLM-L6-v2',
  consentNoticeVersion = 'v1.0',
  consentNoticeText,
  createdByUserId = null,
  startDate = null,
  endDate = null
}) {
  if (!institutionId || typeof institutionId !== 'number') {
    const error = new Error('Valid numeric institution_id is required');
    error.status = 400;
    throw error;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Pilot program name is required');
    error.status = 400;
    throw error;
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    const error = new Error('Pilot program code is required');
    error.status = 400;
    throw error;
  }

  if (!consentNoticeText || typeof consentNoticeText !== 'string' || !consentNoticeText.trim()) {
    const error = new Error('Consent notice text is required to establish voluntary participation terms');
    error.status = 400;
    throw error;
  }

  // Verify institution exists
  const { rows: instRows } = await db.query(
    'SELECT id, name FROM institutions WHERE id = $1',
    [institutionId]
  );
  if (!instRows[0]) {
    const error = new Error(`Institution ID ${institutionId} not found`);
    error.status = 404;
    throw error;
  }

  // Check unique code
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const { rows: codeCheck } = await db.query(
    'SELECT id FROM pilot_programs WHERE code = $1',
    [cleanCode]
  );
  if (codeCheck[0]) {
    const error = new Error(`Pilot program with code '${cleanCode}' already exists`);
    error.status = 409;
    throw error;
  }

  const { rows: progRows } = await db.query(
    `INSERT INTO pilot_programs (
      institution_id, name, code, status, target_engine_version, target_model_version,
      consent_notice_version, consent_notice_text, created_by_user_id, start_date, end_date
    ) VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      institutionId,
      name.trim(),
      cleanCode,
      targetEngineVersion,
      targetModelVersion,
      consentNoticeVersion.trim(),
      consentNoticeText.trim(),
      createdByUserId,
      startDate,
      endDate
    ]
  );

  const program = progRows[0];

  // Record audit log
  await db.query(
    `INSERT INTO pilot_audit_logs (pilot_program_id, actor_user_id, action, details)
     VALUES ($1, $2, 'pilot_created', $3)`,
    [
      program.id,
      createdByUserId,
      JSON.stringify({ code: cleanCode, institution_id: institutionId, status: 'draft' })
    ]
  );

  return program;
}

/**
 * List pilot programs with enrollment metrics and tenant filtering
 */
export async function getPilotPrograms({ institutionId = null } = {}) {
  let query = `
    SELECT 
      pp.*,
      inst.name as institution_name,
      inst.code as institution_code,
      COUNT(pe.id)::int as total_enrolled,
      COUNT(CASE WHEN pe.consent_status = 'opted_in' AND pe.status IN ('enrolled', 'active') THEN 1 END)::int as active_participants,
      COUNT(CASE WHEN pe.consent_status = 'withdrawn' THEN 1 END)::int as withdrawn_participants
    FROM pilot_programs pp
    JOIN institutions inst ON pp.institution_id = inst.id
    LEFT JOIN pilot_enrollments pe ON pp.id = pe.pilot_program_id
  `;

  const params = [];
  if (institutionId) {
    params.push(parseInt(institutionId, 10));
    query += ` WHERE pp.institution_id = $1`;
  }

  query += `
    GROUP BY pp.id, inst.name, inst.code
    ORDER BY pp.created_at DESC
  `;

  const { rows } = await db.query(query, params);
  return rows;
}

/**
 * Retrieve single pilot program by ID with tenant verification
 */
export async function getPilotProgramById(pilotProgramId) {
  const { rows } = await db.query(
    `SELECT 
      pp.*,
      inst.name as institution_name,
      inst.code as institution_code,
      COUNT(pe.id)::int as total_enrolled,
      COUNT(CASE WHEN pe.consent_status = 'opted_in' AND pe.status IN ('enrolled', 'active') THEN 1 END)::int as active_participants,
      COUNT(CASE WHEN pe.consent_status = 'withdrawn' THEN 1 END)::int as withdrawn_participants
    FROM pilot_programs pp
    JOIN institutions inst ON pp.institution_id = inst.id
    LEFT JOIN pilot_enrollments pe ON pp.id = pe.pilot_program_id
    WHERE pp.id = $1
    GROUP BY pp.id, inst.name, inst.code`,
    [pilotProgramId]
  );

  return rows[0] || null;
}

/**
 * Update pilot program lifecycle status (draft -> active -> concluded -> archived)
 */
export async function updatePilotProgramStatus({ pilotProgramId, newStatus, actorUserId = null }) {
  if (!VALID_PILOT_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status '${newStatus}'. Allowed: ${VALID_PILOT_STATUSES.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const existing = await getPilotProgramById(pilotProgramId);
  if (!existing) {
    const error = new Error(`Pilot program ID ${pilotProgramId} not found`);
    error.status = 404;
    throw error;
  }

  const { rows } = await db.query(
    `UPDATE pilot_programs
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [newStatus, pilotProgramId]
  );

  await db.query(
    `INSERT INTO pilot_audit_logs (pilot_program_id, actor_user_id, action, details)
     VALUES ($1, $2, 'status_changed', $3)`,
    [
      pilotProgramId,
      actorUserId,
      JSON.stringify({ previous_status: existing.status, new_status: newStatus })
    ]
  );

  return rows[0];
}

/**
 * Student voluntary opt-in to an active pilot program
 * Strictly validates eligibility:
 * 1. Pilot program must be in 'active' status
 * 2. Student candidate must belong to the institution offering the pilot
 * 3. Consent notice version must match the active notice version
 */
export async function optInToPilot({
  candidateId,
  pilotProgramId,
  consentNoticeVersion,
  actorUserId = null
}) {
  if (!pilotProgramId || isNaN(parseInt(pilotProgramId, 10))) {
    const error = new Error('Valid numeric pilot_program_id is required');
    error.status = 400;
    throw error;
  }

  const program = await getPilotProgramById(parseInt(pilotProgramId, 10));
  if (!program) {
    const error = new Error('Referenced pilot program not found');
    error.status = 404;
    throw error;
  }

  // 1. Program must be in active status
  if (program.status !== 'active') {
    const error = new Error(`Pilot program '${program.name}' is currently in '${program.status}' status and cannot accept opt-ins`);
    error.status = 400;
    throw error;
  }

  // 2. Student eligibility: candidate must be enrolled in the program's institution
  const { rows: memRows } = await db.query(
    `SELECT im.institution_id 
     FROM candidates c
     JOIN institution_memberships im ON c.user_id = im.user_id
     WHERE c.id = $1 AND im.institution_id = $2 AND im.role IN ('student', 'candidate')`,
    [candidateId, program.institution_id]
  );

  if (!memRows[0]) {
    const error = new Error('Forbidden: You can only participate in pilot programs offered by your registered institution');
    error.status = 403;
    throw error;
  }

  // 3. Notice version check
  if (!consentNoticeVersion || consentNoticeVersion.trim() !== program.consent_notice_version) {
    const error = new Error(
      `Consent notice version mismatch: supplied '${consentNoticeVersion}', current is '${program.consent_notice_version}'. Please review the latest terms before consenting.`
    );
    error.status = 400;
    throw error;
  }

  // 4. Upsert enrollment record with timestamp preservation
  const { rows: enrollRows } = await db.query(
    `INSERT INTO pilot_enrollments (
      pilot_program_id, candidate_id, status, consent_status,
      consent_notice_version, consented_at, updated_at
    ) VALUES ($1, $2, 'active', 'opted_in', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (pilot_program_id, candidate_id)
    DO UPDATE SET
      status = 'active',
      consent_status = 'opted_in',
      consent_notice_version = EXCLUDED.consent_notice_version,
      consented_at = CURRENT_TIMESTAMP,
      withdrawn_at = NULL,
      withdrawal_reason = NULL,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [program.id, candidateId, program.consent_notice_version]
  );

  // 5. Audit log
  await db.query(
    `INSERT INTO pilot_audit_logs (pilot_program_id, candidate_id, actor_user_id, action, details)
     VALUES ($1, $2, $3, 'student_opted_in', $4)`,
    [
      program.id,
      candidateId,
      actorUserId,
      JSON.stringify({ consent_notice_version: program.consent_notice_version, institution_id: program.institution_id })
    ]
  );

  return {
    success: true,
    message: `Successfully enrolled in pilot program '${program.name}' with voluntary consent`,
    enrollment: enrollRows[0]
  };
}

/**
 * Student voluntary withdrawal from future pilot telemetry collection
 * Does not destroy historical records; stops future pilot attribution
 */
export async function withdrawFromPilot({
  candidateId,
  pilotProgramId,
  withdrawalReason = null,
  actorUserId = null
}) {
  const { rows: existingRows } = await db.query(
    `SELECT * FROM pilot_enrollments WHERE pilot_program_id = $1 AND candidate_id = $2`,
    [pilotProgramId, candidateId]
  );

  if (!existingRows[0]) {
    const error = new Error('Pilot enrollment not found for this candidate');
    error.status = 404;
    throw error;
  }

  const { rows: updatedRows } = await db.query(
    `UPDATE pilot_enrollments
     SET 
       consent_status = 'withdrawn',
       status = 'withdrawn',
       withdrawn_at = CURRENT_TIMESTAMP,
       withdrawal_reason = $1,
       updated_at = CURRENT_TIMESTAMP
     WHERE pilot_program_id = $2 AND candidate_id = $3
     RETURNING *`,
    [withdrawalReason ? withdrawalReason.trim().slice(0, 500) : null, pilotProgramId, candidateId]
  );

  await db.query(
    `INSERT INTO pilot_audit_logs (pilot_program_id, candidate_id, actor_user_id, action, details)
     VALUES ($1, $2, $3, 'student_withdrawn', $4)`,
    [
      pilotProgramId,
      candidateId,
      actorUserId,
      JSON.stringify({ withdrawal_reason: withdrawalReason || null })
    ]
  );

  return {
    success: true,
    message: 'Voluntary withdrawal recorded. Future recommendation interactions will not be included in pilot analytics.',
    enrollment: updatedRows[0]
  };
}

/**
 * Retrieve pilot participation status for a candidate
 */
export async function getStudentPilotStatus(candidateId) {
  // 1. Get candidate's institution
  const { rows: instRows } = await db.query(
    `SELECT im.institution_id, inst.name as institution_name
     FROM candidates c
     JOIN institution_memberships im ON c.user_id = im.user_id
     JOIN institutions inst ON im.institution_id = inst.id
     WHERE c.id = $1 AND im.role IN ('student', 'candidate')
     LIMIT 1`,
    [candidateId]
  );

  const institutionId = instRows[0]?.institution_id || null;
  const institutionName = instRows[0]?.institution_name || null;

  // 2. Fetch current enrollments
  const { rows: enrollments } = await db.query(
    `SELECT 
      pe.*,
      pp.name as pilot_program_name,
      pp.code as pilot_program_code,
      pp.status as program_status,
      pp.consent_notice_version as active_notice_version,
      pp.consent_notice_text
     FROM pilot_enrollments pe
     JOIN pilot_programs pp ON pe.pilot_program_id = pp.id
     WHERE pe.candidate_id = $1
     ORDER BY pe.updated_at DESC`,
    [candidateId]
  );

  // 3. Fetch active pilot programs available at candidate's institution
  let availablePrograms = [];
  if (institutionId) {
    const { rows: availRows } = await db.query(
      `SELECT id, name, code, target_engine_version, consent_notice_version, consent_notice_text, start_date, end_date
       FROM pilot_programs
       WHERE institution_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [institutionId]
    );
    availablePrograms = availRows;
  }

  const activeEnrollment = enrollments.find(
    e => e.consent_status === 'opted_in' && e.program_status === 'active' && !e.withdrawn_at && e.consent_notice_version === e.active_notice_version
  );

  return {
    is_pilot_participant: Boolean(activeEnrollment),
    active_enrollment: activeEnrollment || null,
    institution_id: institutionId,
    institution_name: institutionName,
    enrollments,
    available_programs: availablePrograms
  };
}
