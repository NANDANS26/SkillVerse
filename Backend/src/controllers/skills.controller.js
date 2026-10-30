// Backend/src/controllers/skills.controller.js
import { db } from '../config/db.js';
import { 
  getCanonicalSkills, 
  calculateCandidateSkillDNA, 
  submitSkillEvidence, 
  reviewSkillEvidence,
  resolveSkill
} from '../services/skill_dna.service.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

/**
 * GET /api/skills
 * Returns canonical skill catalogue
 */
export async function listSkills(req, res) {
  try {
    const skills = await getCanonicalSkills();
    return ok(res, { skills, count: skills.length });
  } catch (error) {
    console.error('List Skills Error:', error);
    return fail(res, 'Failed to fetch skill catalogue: ' + error.message, 500);
  }
}

/**
 * GET /api/candidates/me/skill-dna
 * Evaluates and returns the authenticated candidate's Skill DNA
 */
export async function getMySkillDNA(req, res) {
  try {
    const userId = req.user.id;
    const { rows: candRows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);

    if (!candRows[0]) {
      return fail(res, 'Candidate profile not initialized yet. Please build your profile first.', 404);
    }

    const candidateId = candRows[0].id;
    const skillDNA = await calculateCandidateSkillDNA(candidateId);
    return ok(res, { skill_dna: skillDNA, dna: skillDNA });
  } catch (error) {
    console.error('Get My Skill DNA Error:', error);
    return fail(res, 'Failed to evaluate Skill DNA: ' + error.message, 500);
  }
}

/**
 * GET /api/candidates/:id/skill-dna
 * Evaluates Skill DNA for a specific candidate with role-based access checks
 */
export async function getCandidateSkillDNAById(req, res) {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (isNaN(candidateId)) {
      return fail(res, 'Invalid candidate ID', 400);
    }

    // Role-based authorization:
    // Super admins, recruiters with jobs, and faculty assigned to this candidate can view
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'student') {
      const { rows: myCand } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
      if (!myCand[0] || myCand[0].id !== candidateId) {
        return fail(res, 'Forbidden: You can only view your own Skill DNA profile', 403);
      }
    } else if (userRole === 'faculty') {
      const { rows: candUser } = await db.query('SELECT user_id FROM candidates WHERE id = $1', [candidateId]);
      if (!candUser[0]) return fail(res, 'Candidate not found', 404);
      const studentUserId = candUser[0].user_id;

      const { rows: assign } = await db.query(
        `SELECT * FROM faculty_student_assignments 
         WHERE faculty_id = $1 AND student_id = $2 AND status = 'active'`,
        [userId, studentUserId]
      );
      if (assign.length === 0) {
        return fail(res, 'Forbidden: Faculty member is not assigned to this student', 403);
      }
    }

    const skillDNA = await calculateCandidateSkillDNA(candidateId);

    // Sanitize private feedback and internal details for recruiters
    let responseDNA = skillDNA;
    if (userRole === 'recruiter') {
      responseDNA = {
        ...skillDNA,
        skills: skillDNA.skills.map(s => ({
          ...s,
          evidence_items: s.evidence_items.map(e => ({
            id: e.id,
            source_type: e.source_type,
            title: e.title,
            description: e.description,
            review_status: e.review_status,
            confidence: e.confidence,
            source_reference: e.source_reference,
            created_at: e.created_at,
            reviewed_at: e.reviewed_at
          }))
        }))
      };
    }

    return ok(res, { skill_dna: responseDNA, dna: responseDNA });
  } catch (error) {
    console.error('Get Candidate Skill DNA Error:', error);
    return fail(res, 'Failed to evaluate candidate Skill DNA: ' + error.message, 500);
  }
}

/**
 * POST /api/candidates/me/evidence
 * Student submits project or repo evidence for review
 */
export async function submitEvidence(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return fail(res, 'Authentication required to submit evidence', 401);
    }
    const userId = req.user.id;
    const { rows: candRows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);

    if (!candRows[0]) {
      return fail(res, 'Candidate profile not initialized yet.', 404);
    }
    const candidateId = candRows[0].id;

    const { 
      skill_slug, 
      skill_id, 
      source_type = 'project_submission', 
      title, 
      claim_title,
      description, 
      claim_description,
      source_reference,
      evidence_url,
      metadata,
      evidence_metadata
    } = req.body;

    const evidenceTitle = (title || claim_title || '').trim();
    if (!evidenceTitle) {
      return fail(res, 'Evidence title is required', 400);
    }
    if (evidenceTitle.length > 255) {
      return fail(res, 'Evidence title must not exceed 255 characters', 400);
    }

    // Resolve canonical skill
    let resolvedSkillId = skill_id;
    if (!resolvedSkillId && skill_slug) {
      const s = await resolveSkill(skill_slug);
      if (s) resolvedSkillId = s.id;
    }

    if (!resolvedSkillId) {
      return fail(res, 'Valid canonical skill_id or skill_slug is required', 400);
    }

    // Restrict student self-approval: student submissions must be project_submission or self_reported
    if (source_type !== 'project_submission' && source_type !== 'self_reported') {
      return fail(res, "Students may only submit 'project_submission' or 'self_reported' evidence", 400);
    }

    const evidenceDesc = (description || claim_description || '').trim() || null;
    if (evidenceDesc && evidenceDesc.length > 2000) {
      return fail(res, 'Evidence description must not exceed 2000 characters', 400);
    }

    const evidenceRef = (source_reference || evidence_url || '').trim() || null;
    if (evidenceRef) {
      if (evidenceRef.length > 500) {
        return fail(res, 'Source reference URL must not exceed 500 characters', 400);
      }
      // Security check: Validate URL protocol and structure
      try {
        const parsedUrl = new URL(evidenceRef);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return fail(res, 'Invalid URL scheme. Only HTTP/HTTPS URLs are supported.', 400);
        }
        // Block SSRF / localhost / private IP attempts
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.endsWith('.local') || hostname === '169.254.169.254') {
          return fail(res, 'Localhost or private network URLs are not permitted as evidence.', 400);
        }
        // If claiming to be github.com, enforce valid repo pattern: github.com/{owner}/{repo}
        if (hostname === 'github.com' || hostname === 'www.github.com') {
          const parts = parsedUrl.pathname.split('/').filter(Boolean);
          if (parts.length < 2) {
            return fail(res, 'GitHub repository URL must be in format https://github.com/{owner}/{repository}', 400);
          }
        }
      } catch (urlErr) {
        return fail(res, 'Invalid source reference URL format: ' + urlErr.message, 400);
      }
    }

    // Sanitize metadata payload: strip any attempt to inject privileged review fields
    let metaPayload = {};
    const rawMeta = metadata || evidence_metadata;
    if (rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta)) {
      const { verified, reviewer_id, review_status, confidence_score, proficiency_score, ...safeMeta } = rawMeta;
      metaPayload = safeMeta;
    }

    const evidence = await submitSkillEvidence({
      candidateId,
      skillId: resolvedSkillId,
      sourceType: source_type,
      title: evidenceTitle,
      description: evidenceDesc,
      sourceReference: evidenceRef,
      metadata: metaPayload
    });

    const isDuplicate = evidence.duplicate_detected || false;
    let message = 'Skill evidence submitted successfully for mentorship review';
    let statusCode = 201;

    if (evidence.status_action === 'updated_pending') {
      message = 'Existing pending repository submission updated with latest contribution summary';
      statusCode = 200;
    } else if (evidence.status_action === 'already_verified') {
      message = 'This repository evidence has already been verified for this skill by your faculty advisor';
      statusCode = 200;
    }

    return ok(res, {
      message,
      duplicate_detected: isDuplicate,
      status_action: evidence.status_action || 'created',
      evidence
    }, statusCode);
  } catch (error) {
    console.error('Submit Evidence Error:', error);
    const status = error.status || 500;
    return fail(res, 'Failed to submit evidence: ' + error.message, status);
  }
}

/**
 * GET /api/candidates/me/evidence
 * Student retrieves all their submitted evidence records
 */
export async function getMyEvidence(req, res) {
  try {
    const userId = req.user.id;
    const { rows: candRows } = await db.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);

    if (!candRows[0]) {
      return fail(res, 'Candidate profile not found', 404);
    }
    const candidateId = candRows[0].id;

    const { rows: evidence } = await db.query(
      `SELECT e.*, s.name as skill_name, s.slug as skill_slug, s.category as skill_category,
              u.name as reviewer_name
       FROM skill_evidence e
       JOIN skills s ON e.skill_id = s.id
       LEFT JOIN users u ON e.reviewer_id = u.id
       WHERE e.candidate_id = $1
       ORDER BY e.created_at DESC`,
      [candidateId]
    );

    return ok(res, { evidence, count: evidence.length });
  } catch (error) {
    console.error('Get My Evidence Error:', error);
    return fail(res, 'Failed to fetch evidence items: ' + error.message, 500);
  }
}

/**
 * GET /api/faculty/pending-evidence
 * Faculty member retrieves pending project evidence for their assigned mentee students
 */
export async function getPendingFacultyEvidence(req, res) {
  try {
    const facultyUserId = req.user.id;

    const { rows: evidence } = await db.query(
      `SELECT e.*, 
              e.title as claim_title,
              e.description as claim_description,
              e.source_reference as evidence_url,
              s.name as skill_name, s.slug as skill_slug,
              c.full_name as student_name, c.email as student_email, c.id as candidate_id
       FROM skill_evidence e
       JOIN skills s ON e.skill_id = s.id
       JOIN candidates c ON e.candidate_id = c.id
       JOIN faculty_student_assignments fsa ON c.user_id = fsa.student_id
       WHERE fsa.faculty_id = $1 
         AND fsa.status = 'active'
         AND e.review_status = 'pending_review'
       ORDER BY e.created_at ASC`,
      [facultyUserId]
    );

    return ok(res, { pending_evidence: evidence, count: evidence.length });
  } catch (error) {
    console.error('Get Pending Faculty Evidence Error:', error);
    return fail(res, 'Failed to fetch pending evidence: ' + error.message, 500);
  }
}

/**
 * PATCH /api/faculty/evidence/:id/review
 * Faculty member accepts ('verified') or rejects student evidence with feedback
 */
export async function reviewEvidence(req, res) {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    const facultyUserId = req.user.id;
    const { decision, feedback, notes } = req.body;

    if (isNaN(evidenceId)) {
      return fail(res, 'Valid numeric evidence id is required', 400);
    }

    if (!decision || (decision !== 'verified' && decision !== 'rejected')) {
      return fail(res, "Review decision must be 'verified' or 'rejected'", 400);
    }

    const updated = await reviewSkillEvidence({
      evidenceId,
      reviewerUserId: facultyUserId,
      decision,
      feedbackNotes: feedback || notes
    });

    return ok(res, {
      message: `Evidence marked as ${decision}`,
      evidence: updated
    });
  } catch (error) {
    console.error('Review Evidence Error:', error);
    const status = error.status || (error.message.includes('Forbidden') ? 403 : 500);
    return fail(res, error.message, status);
  }
}
