// Backend/src/controllers/feedback.controller.js
import { db } from '../config/db.js';
import {
  recordImpressions,
  recordInteraction,
  submitFeedback,
  getStudentFeedback,
  getEvaluationDataset
} from '../services/feedback.service.js';

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
 * POST /api/student/roadmap/impressions
 * Records batch of recommendations displayed to the authenticated student
 * Anti-spoofing: provenance_tag from client body is strictly ignored; provenance is resolved server-side.
 */
export async function postImpressions(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const { roadmap_id, presentation_id, impressions, surface } = req.body;
    if (!roadmap_id) {
      return fail(res, 'Missing required roadmap_id', 400);
    }

    const result = await recordImpressions({
      candidateId,
      roadmapId: parseInt(roadmap_id, 10),
      presentationId: presentation_id,
      impressions: impressions || [],
      surface: surface || 'learning_roadmap',
      provenanceTag: null // Server-enforced resolution
    });

    return ok(res, result, 201);
  } catch (error) {
    console.error('Record Impressions Error:', error);
    const status = error.status || (error.message.includes('Forbidden') ? 403 : 500);
    return fail(res, error.message, status);
  }
}

/**
 * POST /api/student/roadmap/interactions
 * Records authenticated interaction event (opened, started, progress_recorded, completed, dismissed)
 * Anti-spoofing: provenance_tag from client body is strictly ignored; provenance is resolved server-side.
 */
export async function postInteraction(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const {
      recommendation_id,
      event_type,
      idempotency_key,
      presentation_id,
      progress_pct,
      interaction_metadata
    } = req.body;

    if (!recommendation_id) {
      return fail(res, 'recommendation_id is required', 400);
    }

    const result = await recordInteraction({
      candidateId,
      recommendationId: parseInt(recommendation_id, 10),
      eventType: event_type,
      idempotencyKey: idempotency_key,
      presentationId: presentation_id || null,
      progressPct: progress_pct !== undefined ? progress_pct : null,
      interactionMetadata: interaction_metadata || {},
      provenanceTag: null // Server-enforced resolution
    });

    const statusCode = result.duplicate ? 200 : 201;
    return ok(res, result, statusCode);
  } catch (error) {
    console.error('Record Interaction Error:', error);
    const status = error.status || (error.message.includes('Forbidden') ? 403 : 500);
    return fail(res, error.message, status);
  }
}

/**
 * POST /api/student/roadmap/feedback
 * Submits or updates explicit relevance feedback
 * Anti-spoofing: provenance_tag from client body is strictly ignored; provenance is resolved server-side.
 */
export async function postFeedback(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const {
      recommendation_id,
      rating,
      reason_category,
      feedback_text,
      presentation_id
    } = req.body;

    if (!recommendation_id) {
      return fail(res, 'recommendation_id is required', 400);
    }

    const result = await submitFeedback({
      candidateId,
      recommendationId: parseInt(recommendation_id, 10),
      rating,
      reasonCategory: reason_category || null,
      feedbackText: feedback_text || null,
      presentationId: presentation_id || null,
      provenanceTag: null // Server-enforced resolution
    });

    return ok(res, result, 201);
  } catch (error) {
    console.error('Submit Feedback Error:', error);
    const status = error.status || (error.message.includes('Forbidden') ? 403 : 500);
    return fail(res, error.message, status);
  }
}

/**
 * GET /api/student/roadmap/feedback
 * Returns all explicit relevance feedback for the current student
 */
export async function getFeedback(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const feedback = await getStudentFeedback(candidateId);
    return ok(res, { feedback, count: feedback.length });
  } catch (error) {
    console.error('Get Feedback Error:', error);
    return fail(res, error.message, error.status || 500);
  }
}

/**
 * GET /api/analytics/recommendations/evaluation
 * Returns aggregate recommendation evaluation metrics, funnel stages, and data partitions.
 * Strictly enforces role boundaries and tenant scoping.
 */
export async function getEvaluationReport(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return fail(res, 'Authentication required', 401);
    }

    const { start_date, end_date, startDate, endDate, institution_id, provenance_filter, provenanceFilter } = req.query;
    let targetInstitutionId = null;

    if (user.role === 'college_admin') {
      // 1. Resolve college admin's verified institution membership
      const { rows: memRows } = await db.query(
        'SELECT institution_id FROM institution_memberships WHERE user_id = $1 LIMIT 1',
        [user.id]
      );

      if (!memRows[0]?.institution_id) {
        return ok(res, {
          evaluation_status: 'TENANT_NOT_FOUND',
          status_notice: 'Institution affiliation not established for this college administrator. Tenant-specific data is unavailable.',
          institution_id: null,
          institution_name: null,
          provenance_partitions: null,
          funnel_metrics: [],
          message: 'User is not assigned to an active institution.'
        });
      }

      const authorizedInstitutionId = memRows[0].institution_id;

      // 2. Cross-tenant defense: college admin cannot request another institution
      if (institution_id) {
        const requestedId = parseInt(institution_id, 10);
        if (requestedId !== authorizedInstitutionId) {
          return fail(res, 'Forbidden: You cannot access recommendation evaluation for another institution', 403);
        }
      }

      targetInstitutionId = authorizedInstitutionId;
    } else if (user.role === 'super_admin') {
      // Super admin can view platform-wide (null) or inspect a specific institution
      if (institution_id) {
        targetInstitutionId = parseInt(institution_id, 10);
      }
    } else {
      return fail(res, 'Forbidden: Access restricted to authorized administrators', 403);
    }

    const report = await getEvaluationDataset({
      startDate: start_date || startDate || null,
      endDate: end_date || endDate || null,
      institutionId: targetInstitutionId,
      provenanceFilter: provenance_filter || provenanceFilter || 'pilot'
    });

    return ok(res, report);
  } catch (error) {
    console.error('Evaluation Report Error:', error);
    const status = error.status || 500;
    return fail(res, 'Failed to generate evaluation report: ' + error.message, status);
  }
}
