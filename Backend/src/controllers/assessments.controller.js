// Backend/src/controllers/assessments.controller.js
import { db } from '../config/db.js';
import { 
  getAssessmentCatalog, 
  getAssessmentBySlug, 
  submitAssessmentAttempt,
  getCandidateAttempts
} from '../services/assessment.service.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

/**
 * GET /api/assessments
 * List all available standardized technical assessments
 */
export async function listAssessments(req, res) {
  try {
    const assessments = await getAssessmentCatalog();
    return ok(res, { assessments, count: assessments.length });
  } catch (error) {
    console.error('List Assessments Error:', error);
    return fail(res, 'Failed to fetch assessment catalogue: ' + error.message, 500);
  }
}

/**
 * GET /api/assessments/:slug
 * Retrieve assessment details and questions for taking the test
 * (Answer keys are strictly withheld by the service)
 */
export async function getAssessment(req, res) {
  try {
    const slug = req.params.slug;
    const assessment = await getAssessmentBySlug(slug);

    if (!assessment) {
      return fail(res, `Assessment '${slug}' not found`, 404);
    }

    return ok(res, { assessment, questions: assessment.questions });
  } catch (error) {
    console.error('Get Assessment Error:', error);
    return fail(res, 'Failed to fetch assessment: ' + error.message, 500);
  }
}

/**
 * POST /api/assessments/:slug/submit
 * Candidate submits assessment answers for server-side grading and verified Skill DNA generation
 */
export async function submitAttempt(req, res) {
  try {
    const userId = req.user.id;
    const { rows: candRows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);

    if (!candRows[0]) {
      return fail(res, 'Candidate profile not initialized yet. Please build your profile first.', 404);
    }
    const candidateId = candRows[0].id;
    const slug = req.params.slug;
    const { answers, duration_seconds = 0 } = req.body;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return fail(res, 'Submitted answers object cannot be empty', 400);
    }

    const result = await submitAssessmentAttempt({
      candidateId,
      slug,
      answers,
      durationSeconds: duration_seconds
    });

    return ok(res, {
      message: result.passed
        ? `Assessment passed! Objective Skill DNA evidence verified with score ${(result.score * 100).toFixed(0)}%.`
        : `Assessment completed. Score ${(result.score * 100).toFixed(0)}% was below the ${(result.pass_threshold * 100).toFixed(0)}% verification threshold.`,
      score: Math.round(result.score * 100),
      raw_score: result.score,
      passed: result.passed,
      pass_threshold: result.pass_threshold,
      passing_score: Math.round(result.pass_threshold * 100),
      evidence_id: result.verified_evidence_id,
      confidence: result.passed ? 0.85 : 0.0,
      result
    }, 201);
  } catch (error) {
    console.error('Submit Assessment Error:', error);
    return fail(res, 'Failed to grade assessment: ' + error.message, 500);
  }
}

/**
 * GET /api/candidates/me/assessments
 * Candidate retrieves all past assessment attempts
 */
export async function getMyAttempts(req, res) {
  try {
    const userId = req.user.id;
    const { rows: candRows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);

    if (!candRows[0]) {
      return fail(res, 'Candidate profile not found', 404);
    }
    const candidateId = candRows[0].id;

    const attempts = await getCandidateAttempts(candidateId);
    return ok(res, { attempts, count: attempts.length });
  } catch (error) {
    console.error('Get My Attempts Error:', error);
    return fail(res, 'Failed to fetch assessment attempts: ' + error.message, 500);
  }
}
