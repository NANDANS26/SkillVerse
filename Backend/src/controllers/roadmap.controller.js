// Backend/src/controllers/roadmap.controller.js
import { db } from '../config/db.js';
import {
  getStudentGoal,
  setStudentGoal,
  getStudentRoadmap,
  generateDevelopmentRoadmap,
  updateRecommendationStatus,
  getLearningActivitiesCatalogue,
  PREDEFINED_CAREER_ROLES
} from '../services/roadmap.service.js';

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
 * GET /api/student/goal
 * Retrieve current active goal, career presets, and available active jobs
 */
export async function getGoal(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet. Please build your profile first.', 404);
    }

    const goal = await getStudentGoal(candidateId);

    // Also fetch available active jobs for target selection
    const { rows: availableJobs } = await db.query(
      `SELECT j.id, j.title, j.location, j.parsed_json, c.name as company_name 
       FROM jobs j 
       LEFT JOIN companies c ON j.company_id = c.id
       WHERE j.status = 'active'
       ORDER BY j.created_at DESC
       LIMIT 10`
    );

    return ok(res, {
      goal,
      has_goal: !!goal,
      career_presets: PREDEFINED_CAREER_ROLES,
      available_jobs: availableJobs.map(j => ({
        id: j.id,
        title: j.title,
        location: j.location,
        company_name: j.company_name || 'Partner Company',
        skills: j.parsed_json?.skills || []
      }))
    });
  } catch (error) {
    console.error('Get Goal Error:', error);
    return fail(res, 'Failed to fetch student goal: ' + error.message, 500);
  }
}

/**
 * POST /api/student/goal
 * Set or replace active career or target job goal
 */
export async function setGoal(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const { goal_type = 'target_role', target_title, target_job_id, target_skills } = req.body;

    if (!target_title && !target_job_id) {
      return fail(res, 'Either target_title or target_job_id is required', 400);
    }

    const goal = await setStudentGoal({
      candidateId,
      goalType: goal_type,
      targetTitle: target_title,
      targetJobId: target_job_id ? parseInt(target_job_id, 10) : null,
      targetSkills: target_skills
    });

    // Automatically generate fresh roadmap for the newly configured goal
    const roadmap = await generateDevelopmentRoadmap(candidateId);

    return ok(res, {
      message: `Target goal set to '${goal.target_title}' and personalized roadmap generated.`,
      goal,
      roadmap
    }, 201);
  } catch (error) {
    console.error('Set Goal Error:', error);
    return fail(res, 'Failed to set student goal: ' + error.message, error.status || 500);
  }
}

/**
 * GET /api/student/roadmap
 * Retrieve current personalized roadmap, skill gap analysis, and recommendations
 */
export async function getRoadmap(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const roadmapData = await getStudentRoadmap(candidateId);
    return ok(res, roadmapData);
  } catch (error) {
    console.error('Get Roadmap Error:', error);
    return fail(res, 'Failed to fetch roadmap: ' + error.message, 500);
  }
}

/**
 * POST /api/student/roadmap/generate
 * Deterministically regenerate the development roadmap for the active goal
 */
export async function regenerateRoadmap(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const roadmap = await generateDevelopmentRoadmap(candidateId);
    return ok(res, {
      message: 'Development roadmap regenerated successfully.',
      has_goal: true,
      ...roadmap
    });
  } catch (error) {
    console.error('Regenerate Roadmap Error:', error);
    return fail(res, 'Failed to regenerate roadmap: ' + error.message, 500);
  }
}

/**
 * PATCH /api/student/roadmap/recommendations/:id
 * Candidate updates the lifecycle status of a recommendation item
 */
export async function updateRecommendation(req, res) {
  try {
    const candidateId = await getCandidateIdForUser(req.user.id);
    if (!candidateId) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }

    const recommendationId = parseInt(req.params.id, 10);
    if (isNaN(recommendationId)) {
      return fail(res, 'Valid numeric recommendation id is required', 400);
    }

    const { status, completion_metadata } = req.body;
    if (!status) {
      return fail(res, "Missing status parameter ('active', 'in_progress', 'completed', 'dismissed')", 400);
    }

    const updated = await updateRecommendationStatus({
      candidateId,
      recommendationId,
      status,
      completionMetadata: completion_metadata || {}
    });

    return ok(res, {
      message: `Recommendation marked as '${status}'`,
      recommendation: updated
    });
  } catch (error) {
    console.error('Update Recommendation Error:', error);
    const status = error.status || (error.message.includes('Forbidden') ? 403 : 500);
    return fail(res, error.message, status);
  }
}

/**
 * GET /api/student/activities
 * Catalogue of learning and practice activities
 */
export async function listActivities(req, res) {
  try {
    const { skill } = req.query;
    const activities = await getLearningActivitiesCatalogue(skill);
    return ok(res, { activities, count: activities.length });
  } catch (error) {
    console.error('List Activities Error:', error);
    return fail(res, 'Failed to fetch learning activities: ' + error.message, 500);
  }
}
