// Backend/src/controllers/pilot.controller.js
import { db } from '../config/db.js';
import {
  createPilotProgram,
  getPilotPrograms,
  getPilotProgramById,
  updatePilotProgramStatus,
  optInToPilot,
  withdrawFromPilot,
  getStudentPilotStatus
} from '../services/pilot.service.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

/**
 * Helper to fetch candidate_id for authenticated user
 */
async function getCandidateIdForUser(userId) {
  const { rows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  return rows[0]?.id || null;
}

/**
 * Helper to resolve verified institution for college_admin
 */
async function getAdminInstitutionId(userId) {
  const { rows } = await db.query(
    'SELECT institution_id FROM institution_memberships WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return rows[0]?.institution_id || null;
}

/**
 * POST /api/pilot/programs
 * Create a new tenant-scoped pilot program
 */
export async function postCreateProgram(req, res) {
  try {
    const user = req.user;
    if (!['super_admin', 'college_admin'].includes(user.role)) {
      return fail(res, 'Forbidden: Only administrators can create pilot programs', 403);
    }

    const {
      institution_id,
      name,
      code,
      target_engine_version,
      target_model_version,
      consent_notice_version,
      consent_notice_text,
      start_date,
      end_date
    } = req.body;

    let targetInstId = institution_id ? parseInt(institution_id, 10) : null;

    if (user.role === 'college_admin') {
      const authorizedInstId = await getAdminInstitutionId(user.id);
      if (!authorizedInstId) {
        return fail(res, 'Institution affiliation not established for this college administrator', 403);
      }
      if (targetInstId && targetInstId !== authorizedInstId) {
        return fail(res, 'Forbidden: You cannot create pilot programs for another institution', 403);
      }
      targetInstId = authorizedInstId;
    }

    if (!targetInstId) {
      return fail(res, 'Missing required institution_id', 400);
    }

    const program = await createPilotProgram({
      institutionId: targetInstId,
      name,
      code,
      targetEngineVersion: target_engine_version,
      targetModelVersion: target_model_version,
      consentNoticeVersion: consent_notice_version || 'v1.0',
      consentNoticeText: consent_notice_text,
      createdByUserId: user.id,
      startDate: start_date || null,
      endDate: end_date || null
    });

    return ok(res, { program }, 201);
  } catch (error) {
    console.error('Create Pilot Program Error:', error);
    const status = error.status || 500;
    return fail(res, error.message, status);
  }
}

/**
 * GET /api/pilot/programs
 * List pilot programs scoped to institution
 */
export async function getListPrograms(req, res) {
  try {
    const user = req.user;
    let targetInstId = null;

    if (user.role === 'college_admin') {
      targetInstId = await getAdminInstitutionId(user.id);
      if (!targetInstId) {
        return ok(res, { programs: [], count: 0 });
      }
    } else if (user.role === 'super_admin') {
      if (req.query.institution_id) {
        targetInstId = parseInt(req.query.institution_id, 10);
      }
    } else if (user.role === 'student') {
      // Student can view active programs for their institution
      const candidateId = await getCandidateIdForUser(user.id);
      const status = await getStudentPilotStatus(candidateId);
      targetInstId = status.institution_id;
    } else {
      return fail(res, 'Forbidden', 403);
    }

    const programs = await getPilotPrograms({ institutionId: targetInstId });
    return ok(res, { programs, count: programs.length });
  } catch (error) {
    console.error('List Pilot Programs Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * GET /api/pilot/programs/:id
 * Retrieve single pilot program details
 */
export async function getProgramDetails(req, res) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId)) {
      return fail(res, 'Invalid program ID', 400);
    }

    const program = await getPilotProgramById(programId);
    if (!program) {
      return fail(res, 'Pilot program not found', 404);
    }

    // Tenant check for college_admin
    if (req.user.role === 'college_admin') {
      const authorizedInstId = await getAdminInstitutionId(req.user.id);
      if (program.institution_id !== authorizedInstId) {
        return fail(res, 'Forbidden: You cannot access pilot programs from another institution', 403);
      }
    }

    return ok(res, { program });
  } catch (error) {
    console.error('Get Program Details Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * PATCH /api/pilot/programs/:id/status
 * Update program status (draft -> active -> concluded -> archived)
 */
export async function patchProgramStatus(req, res) {
  try {
    const user = req.user;
    if (!['super_admin', 'college_admin'].includes(user.role)) {
      return fail(res, 'Forbidden: Access restricted to authorized administrators', 403);
    }

    const programId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const program = await getPilotProgramById(programId);
    if (!program) {
      return fail(res, 'Pilot program not found', 404);
    }

    if (user.role === 'college_admin') {
      const authorizedInstId = await getAdminInstitutionId(user.id);
      if (program.institution_id !== authorizedInstId) {
        return fail(res, 'Forbidden: You cannot modify pilot programs from another institution', 403);
      }
    }

    const updated = await updatePilotProgramStatus({
      pilotProgramId: programId,
      newStatus: status,
      actorUserId: user.id
    });

    return ok(res, { program: updated });
  } catch (error) {
    console.error('Patch Program Status Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * POST /api/student/pilot/consent
 * Student voluntary opt-in to active pilot program
 */
export async function postStudentConsent(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const { pilot_program_id, consent_notice_version } = req.body;
    if (!pilot_program_id) {
      return fail(res, 'pilot_program_id is required', 400);
    }

    const result = await optInToPilot({
      candidateId,
      pilotProgramId: parseInt(pilot_program_id, 10),
      consentNoticeVersion: consent_notice_version,
      actorUserId: req.user.id
    });

    return ok(res, result, 201);
  } catch (error) {
    console.error('Student Pilot Consent Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * POST /api/student/pilot/withdraw
 * Student voluntary withdrawal from pilot telemetry collection
 */
export async function postStudentWithdraw(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const { pilot_program_id, withdrawal_reason } = req.body;
    if (!pilot_program_id) {
      return fail(res, 'pilot_program_id is required', 400);
    }

    const result = await withdrawFromPilot({
      candidateId,
      pilotProgramId: parseInt(pilot_program_id, 10),
      withdrawalReason: withdrawal_reason || null,
      actorUserId: req.user.id
    });

    return ok(res, result, 200);
  } catch (error) {
    console.error('Student Pilot Withdraw Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * GET /api/student/pilot/status
 * Returns student's active enrollment and available pilot programs
 */
export async function getStudentStatus(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const status = await getStudentPilotStatus(candidateId);
    return ok(res, status);
  } catch (error) {
    console.error('Get Student Pilot Status Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}
