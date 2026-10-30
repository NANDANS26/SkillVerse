// Backend/src/controllers/jobs.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { callMLForMatches } from '../services/ml.service.js';

/**
 * POST /api/jobs
 * Creates a new job posting for the logged-in recruiter.
 */
export const createJob = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const {
      title,
      location,
      raw_text,
      description,
      experience_min,
      experience_max,
      required_skills
    } = req.body;

    if (!recruiterId) {
      return fail(res, 'Authentication required', 401);
    }

    const jobDescription = raw_text || description;
    if (!title || !jobDescription) {
      return fail(res, 'Title and job description are required', 400);
    }

    let parsedJson = null;
    if (required_skills) {
      parsedJson = JSON.stringify({
        skills: Array.isArray(required_skills)
          ? required_skills
          : typeof required_skills === 'string'
          ? required_skills.split(',').map(s => s.trim())
          : []
      });
    }

    const { rows: insertRows } = await db.query(
      `INSERT INTO jobs
       (recruiter_id, title, location, raw_text, parsed_json, experience_min, experience_max, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       RETURNING id`,
      [
        recruiterId,
        title.trim(),
        location ? location.trim() : 'Remote',
        jobDescription,
        parsedJson,
        experience_min !== undefined ? Number(experience_min) : 0,
        experience_max !== undefined ? Number(experience_max) : 10
      ]
    );

    return ok(res, {
      message: 'Job created successfully',
      job_id: insertRows[0].id
    }, 201);
  } catch (error) {
    console.error('Create Job Error:', error);
    return fail(res, 'Failed to create job: ' + error.message, 500);
  }
};

/**
 * GET /api/jobs/:id
 * Fetches job by ID
 */
export const getJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (!rows[0]) {
      return fail(res, 'Job not found', 404);
    }

    const job = rows[0];
    if (typeof job.parsed_json === 'string') {
      try {
        job.parsed_json = JSON.parse(job.parsed_json);
      } catch {}
    }

    return ok(res, { job });
  } catch (error) {
    console.error('Get Job Error:', error);
    return fail(res, 'Failed to fetch job', 500);
  }
};

/**
 * GET /api/jobs/:id/matches
 * Fetches AI ranked candidates for a specific job posting.
 * Explicitly distinguishes genuine zero matches (200 OK, count: 0) from ML service failure (503 Service Unavailable).
 */
export const getMatches = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (!rows[0]) {
      return fail(res, 'Job not found', 404);
    }

    const job = rows[0];

    // Ownership check: recruiters can only view matches for their own jobs (super_admin can view all)
    if (req.user?.role !== 'super_admin' && job.recruiter_id !== req.user?.id) {
      return fail(res, 'Access denied: You do not have permission to view matches for this job', 403);
    }

    try {
      const mode = (req.query?.mode || 'live').toLowerCase();
      const matches = await callMLForMatches(job, 10, mode);

      // Enrich matched candidates with explainable Skill DNA evidence without altering ranking scores
      const enrichedMatches = await Promise.all((matches || []).map(async (m) => {
        if (!m.candidate_id) return m;
        try {
          const { rows: evRows } = await db.query(
            `SELECT s.name as skill_name, e.source_type, e.review_status, e.confidence_score
             FROM skill_evidence e
             JOIN skills s ON e.skill_id = s.id
             WHERE e.candidate_id = $1 AND e.review_status = 'verified'`,
            [m.candidate_id]
          );
          const verifiedSkillNames = [...new Set(evRows.map(r => r.skill_name))];
          const assessmentBacked = [...new Set(evRows.filter(r => r.source_type === 'assessment_result').map(r => r.skill_name))];
          const facultyVerified = [...new Set(evRows.filter(r => r.source_type === 'faculty_review' || r.source_type === 'project_submission').map(r => r.skill_name))];

          return {
            ...m,
            skill_dna_summary: {
              verified_skills: verifiedSkillNames,
              verified_count: verifiedSkillNames.length,
              assessment_backed: assessmentBacked,
              faculty_verified: facultyVerified,
              has_verified_evidence: verifiedSkillNames.length > 0
            }
          };
        } catch {
          return m;
        }
      }));

      return ok(res, {
        job_id: Number(jobId),
        mode,
        matches: enrichedMatches,
        results: enrichedMatches,
        count: enrichedMatches.length
      });
    } catch (mlError) {
      console.error(`[Jobs Error] ML service failure for job ${jobId}:`, mlError.message);
      return fail(
        res,
        'AI Matching Service is currently unavailable. Please verify the Python AI microservice is running.',
        503
      );
    }
  } catch (error) {
    console.error('Get Matches Error:', error);
    return fail(res, 'Failed to fetch matches: ' + error.message, 500);
  }
};

/**
 * GET /api/jobs
 * Lists jobs. If recruiter, lists jobs created by recruiter.
 */
export const listJobs = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let query = 'SELECT * FROM jobs';
    const params = [];

    if (role === 'recruiter') {
      query += ' WHERE recruiter_id = $1';
      params.push(userId);
    } else if (role === 'student') {
      query += " WHERE status = 'open'";
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await db.query(query, params);

    const jobs = rows.map(j => {
      if (typeof j.parsed_json === 'string') {
        try { j.parsed_json = JSON.parse(j.parsed_json); } catch {}
      }
      return j;
    });

    return ok(res, { jobs, count: jobs.length });
  } catch (error) {
    console.error('List Jobs Error:', error);
    return fail(res, 'Failed to fetch jobs', 500);
  }
};

/**
 * POST /api/jobs/:id/apply
 * Applies the authenticated student to a job.
 */
export const applyToJob = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // 1. Verify candidate profile exists
    const { rows: candidateRows } = await db.query(
      'SELECT id, full_name, email FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1',
      [userId || -1, userEmail || '']
    );

    if (!candidateRows[0]) {
      return fail(res, 'Please create your candidate profile before applying to jobs', 400);
    }

    const candidateId = candidateRows[0].id;

    // 2. Verify job exists and is open
    const { rows: jobRows } = await db.query(
      'SELECT id, title, recruiter_id, status FROM jobs WHERE id = $1',
      [jobId]
    );

    if (!jobRows[0]) {
      return fail(res, 'Job requisition not found', 404);
    }

    if (jobRows[0].status !== 'open') {
      return fail(res, 'Job requisition is no longer accepting applications', 400);
    }

    // 3. Upsert application
    const { rows: appRows } = await db.query(
      `INSERT INTO applications (job_id, candidate_id, status, created_at, updated_at)
       VALUES ($1, $2, 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (job_id, candidate_id) DO UPDATE
       SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, job_id, candidate_id, status, created_at`,
      [jobId, candidateId]
    );

    // 4. Record audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'APPLY_JOB', 'application', $2, $3)`,
      [userId, appRows[0].id, JSON.stringify({ job_id: jobId, candidate_id: candidateId })]
    );

    return ok(res, {
      message: 'Application submitted successfully',
      application: appRows[0]
    }, 201);
  } catch (error) {
    console.error('Apply To Job Error:', error);
    return fail(res, 'Failed to submit application: ' + error.message, 500);
  }
};

/**
 * GET /api/jobs/:id/applications
 * Retrieves applications submitted to a specific job (recruiter ownership enforced).
 */
export const getJobApplications = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const role = req.user?.role;

    // Verify job ownership
    const { rows: jobRows } = await db.query('SELECT recruiter_id, title FROM jobs WHERE id = $1', [jobId]);
    if (!jobRows[0]) {
      return fail(res, 'Job not found', 404);
    }

    if (role !== 'super_admin' && jobRows[0].recruiter_id !== userId) {
      return fail(res, 'Access denied: You do not have permission to view applications for this job', 403);
    }

    const { rows: appRows } = await db.query(
      `SELECT a.id, a.job_id, a.candidate_id, a.status, a.match_score, a.created_at, a.updated_at,
              c.full_name, c.email, c.headline, c.experience_years, c.skill_json, c.resume_text
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [jobId]
    );

    const applications = appRows.map(a => {
      let skills = [];
      if (a.skill_json) {
        skills = typeof a.skill_json === 'string' ? JSON.parse(a.skill_json) : a.skill_json;
      }
      return {
        ...a,
        skills
      };
    });

    return ok(res, {
      job_id: jobId,
      job_title: jobRows[0].title,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Get Job Applications Error:', error);
    return fail(res, 'Failed to fetch job applications: ' + error.message, 500);
  }
};

/**
 * PATCH /api/jobs/:id/applications/:appId
 * Updates application status (e.g. reviewing, interviewing, offered, rejected).
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const appId = parseInt(req.params.appId, 10);
    const { status, notes } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    const validStatuses = ['applied', 'reviewing', 'interviewing', 'offered', 'rejected'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return fail(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify job ownership
    const { rows: jobRows } = await db.query('SELECT recruiter_id FROM jobs WHERE id = $1', [jobId]);
    if (!jobRows[0]) {
      return fail(res, 'Job not found', 404);
    }

    if (role !== 'super_admin' && jobRows[0].recruiter_id !== userId) {
      return fail(res, 'Access denied: You do not have permission to update applications for this job', 403);
    }

    const { rows: updatedRows } = await db.query(
      `UPDATE applications
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND job_id = $3
       RETURNING id, job_id, candidate_id, status, updated_at`,
      [status.toLowerCase(), appId, jobId]
    );

    if (!updatedRows[0]) {
      return fail(res, 'Application not found for this job', 404);
    }

    // Record audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'UPDATE_APPLICATION_STATUS', 'application', $2, $3)`,
      [userId, appId, JSON.stringify({ job_id: jobId, status, notes })]
    );

    return ok(res, {
      message: 'Application status updated successfully',
      application: updatedRows[0]
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    return fail(res, 'Failed to update application: ' + error.message, 500);
  }
};
