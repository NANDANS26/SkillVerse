// Backend/src/controllers/candidates.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { callMLToEmbedCandidate } from '../services/ml.service.js';
import { enqueueCandidateIndexing } from '../services/indexing_queue.service.js';

/**
 * POST /api/candidates
 * Body: { full_name, headline, email, phone, experience_years, resume_text, skill_json }
 * Links to req.user.id with ownership and upsert logic.
 */
export const createCandidate = async (req, res) => {
  const client = typeof db.connect === 'function' ? await db.connect() : null;
  const runner = client || db;
  const inTransaction = !!client;

  if (inTransaction) {
    await client.query('BEGIN');
  }

  try {
    const userId = req.user?.id;
    const {
      full_name,
      headline,
      email,
      phone,
      experience_years,
      resume_text,
      skill_json
    } = req.body;

    const candidateEmail = (email || req.user?.email || '').toLowerCase().trim();
    const candidateName = (full_name || req.user?.name || '').trim();

    if (!candidateName || !candidateEmail) {
      if (inTransaction) await client.query('ROLLBACK');
      return fail(res, 'Name and email are required', 400);
    }

    // Check if a candidate profile already exists for this user_id or email
    const { rows: existing } = await runner.query(
      'SELECT id, user_id FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1',
      [userId || -1, candidateEmail]
    );

    const skillsData = JSON.stringify(Array.isArray(skill_json) ? skill_json : (skill_json ? [skill_json] : []));
    const expYears = experience_years !== undefined && experience_years !== null && !isNaN(Number(experience_years))
      ? Number(experience_years)
      : 0;

    let candidateId;
    if (existing.length > 0) {
      const existingProfile = existing[0];
      // Ownership check: if profile has a user_id and it is not the current user (and user is not super_admin)
      if (existingProfile.user_id && existingProfile.user_id !== userId && req.user?.role !== 'super_admin') {
        if (inTransaction) await client.query('ROLLBACK');
        return fail(res, 'Access denied: Profile belongs to another user', 403);
      }

      await runner.query(
        `UPDATE candidates
         SET user_id = $1, full_name = $2, headline = $3, email = $4, phone = $5,
             experience_years = $6, resume_text = $7, skill_json = $8, updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          userId || existingProfile.user_id,
          candidateName,
          headline || null,
          candidateEmail,
          phone || null,
          expYears,
          resume_text || null,
          skillsData,
          existingProfile.id
        ]
      );
      candidateId = existingProfile.id;
    } else {
      const { rows: insertRows } = await runner.query(
        `INSERT INTO candidates
         (user_id, full_name, headline, email, phone, experience_years, resume_text, skill_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId || null,
          candidateName,
          headline || null,
          candidateEmail,
          phone || null,
          expYears,
          resume_text || null,
          skillsData
        ]
      );
      candidateId = insertRows[0].id;
    }

    // Record durable indexing request in PostgreSQL outbox queue within the SAME transaction
    const queueItem = await enqueueCandidateIndexing(candidateId, runner);

    // Commit both candidate profile write and outbox queue insertion atomically
    if (inTransaction) {
      await client.query('COMMIT');
    }

    // Attempt immediate dynamic vector indexing (optimistic inline dispatch)
    let indexingStatus = 'pending';
    try {
      const embedRes = await callMLToEmbedCandidate({
        candidate_id: candidateId,
        full_name: candidateName,
        headline: headline || null,
        email: candidateEmail,
        experience_years: expYears,
        resume_text: resume_text || null,
        skill_json: skillsData
      });
      if (embedRes?.status === 'indexed') {
        indexingStatus = 'indexed';
        if (queueItem?.id) {
          await db.query(
            `UPDATE indexing_queue SET status = 'completed', last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [queueItem.id]
          );
        }
      }
    } catch (mlErr) {
      console.warn(`[Dynamic Indexing Deferred] Profile saved to DB, indexing deferred for candidate ${candidateId}:`, mlErr.message);
      if (queueItem?.id) {
        await db.query(
          `UPDATE indexing_queue SET last_error = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [mlErr.message.substring(0, 1000), queueItem.id]
        );
      }
      indexingStatus = 'pending';
    }

    return ok(res, {
      message: 'Candidate profile saved successfully',
      candidate_id: candidateId,
      indexing_status: indexingStatus
    }, 201);
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback error on closed connection
      }
    }
    console.error('Create/Update Candidate Error:', error);
    return fail(res, 'Failed to save candidate profile: ' + error.message);
  } finally {
    if (client && typeof client.release === 'function') {
      client.release();
    }
  }
};

/**
 * GET /api/candidates/me
 * Fetches candidate profile for the currently authenticated user
 */
export const getMyCandidateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return fail(res, 'Unauthorized', 401);
    }

    const { rows } = await db.query(
      'SELECT * FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1',
      [userId || -1, userEmail || '']
    );

    if (rows.length === 0) {
      return ok(res, { candidate: null });
    }

    const candidate = rows[0];
    if (typeof candidate.skill_json === 'string') {
      try {
        candidate.skill_json = JSON.parse(candidate.skill_json);
      } catch {}
    }

    // Query indexing status from queue
    const { rows: queueRows } = await db.query(
      'SELECT status, attempts, last_error FROM indexing_queue WHERE candidate_id = $1 ORDER BY id DESC LIMIT 1',
      [candidate.id]
    );
    let indexingStatus = 'unindexed';
    if (queueRows[0]) {
      if (queueRows[0].status === 'completed') {
        indexingStatus = 'indexed';
      } else if (queueRows[0].status === 'pending' || queueRows[0].status === 'processing') {
        indexingStatus = 'pending';
      } else if (queueRows[0].status === 'failed') {
        indexingStatus = 'failed';
      }
    }
    candidate.indexing_status = indexingStatus;
    candidate.indexing_error = queueRows[0]?.last_error || null;

    // Query applied jobs count
    const { rows: appCount } = await db.query(
      'SELECT COUNT(*)::int as count FROM applications WHERE candidate_id = $1',
      [candidate.id]
    );
    candidate.applications_count = appCount[0]?.count || 0;

    return ok(res, { candidate });
  } catch (error) {
    console.error('Get My Candidate Error:', error);
    return fail(res, 'Failed to fetch candidate profile');
  }
};

/**
 * GET /api/candidates/me/applications
 * Retrieves applications submitted by the authenticated student.
 */
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    const { rows: candidateRows } = await db.query(
      'SELECT id FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1',
      [userId || -1, userEmail || '']
    );

    if (!candidateRows[0]) {
      return ok(res, { applications: [], count: 0 });
    }

    const candidateId = candidateRows[0].id;
    const { rows: appRows } = await db.query(
      `SELECT a.id, a.job_id, a.candidate_id, a.status, a.match_score, a.created_at, a.updated_at,
              j.title as job_title, j.location as job_location, j.experience_min, j.experience_max,
              u.name as recruiter_name, u.email as recruiter_email,
              comp.name as company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON j.recruiter_id = u.id
       LEFT JOIN companies comp ON j.company_id = comp.id
       WHERE a.candidate_id = $1
       ORDER BY a.created_at DESC`,
      [candidateId]
    );

    return ok(res, { applications: appRows, count: appRows.length });
  } catch (error) {
    console.error('Get My Applications Error:', error);
    return fail(res, 'Failed to fetch applications: ' + error.message, 500);
  }
};

/**
 * GET /api/candidates
 * Lists candidates (for recruiters and admins)
 */
export const listCandidates = async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, user_id, full_name, headline, email, phone, experience_years, skill_json, created_at FROM candidates ORDER BY id DESC'
    );

    const parsed = rows.map(c => {
      let skills = [];
      if (typeof c.skill_json === 'string') {
        try { skills = JSON.parse(c.skill_json); } catch {}
      } else if (Array.isArray(c.skill_json)) {
        skills = c.skill_json;
      }
      return { ...c, skills };
    });

    return ok(res, { candidates: parsed, count: parsed.length });
  } catch (error) {
    console.error('List Candidates Error:', error);
    return fail(res, 'Failed to list candidates');
  }
};

/**
 * GET /api/candidates/:id
 * Fetches candidate by id with privacy checks
 */
export const getCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;

    const { rows } = await db.query(
      'SELECT * FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (!rows[0]) {
      return fail(res, 'Candidate not found', 404);
    }

    const candidate = rows[0];

    // Privacy & Ownership enforcement:
    // If requester is a student, they can only view their own candidate profile.
    if (req.user?.role === 'student') {
      const isOwner = (candidate.user_id && candidate.user_id === req.user.id) ||
                      (candidate.email && candidate.email === req.user.email);
      if (!isOwner) {
        return fail(res, 'Access denied: You do not have permission to view this candidate profile', 403);
      }
    }

    if (typeof candidate.skill_json === 'string') {
      try {
        candidate.skill_json = JSON.parse(candidate.skill_json);
      } catch {}
    }

    return ok(res, { candidate });
  } catch (error) {
    console.error('Get Candidate Error:', error);
    return fail(res, 'Failed to fetch candidate');
  }
};
