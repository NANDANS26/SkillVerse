// Backend/src/services/skill_dna.service.js
import { db } from '../config/db.js';

export const SKILL_DNA_ENGINE_VERSION = 'v1.1.0-deterministic-heuristic';

/**
 * Baseline confidence weights by evidence source type (scale 0.0 - 1.0)
 * Note: These are auditable heuristic trust weights, representing evidence reliability
 * rather than a statistically calibrated probability distribution.
 */
export const EVIDENCE_CONFIDENCE_WEIGHTS = {
  self_reported: 0.150,
  resume_extracted: 0.250,
  project_submission: 0.350, // unreviewed student project
  project_submission_verified: 0.750, // reviewed & verified by assigned faculty
  assessment_result: 0.850, // server-graded standardized assessment passed
  faculty_review: 0.900 // direct academic evaluation by assigned faculty
};

/**
 * Retrieve canonical skill catalogue
 */
export async function getCanonicalSkills() {
  const { rows } = await db.query(
    'SELECT id, slug, name, category, description, aliases FROM skills ORDER BY category ASC, name ASC'
  );
  return rows;
}

/**
 * Find canonical skill by name, slug, or alias
 */
export async function resolveSkill(skillIdentifier) {
  if (!skillIdentifier) return null;
  const normalized = String(skillIdentifier).trim().toLowerCase();

  // Try slug match
  const { rows: slugRows } = await db.query(
    'SELECT * FROM skills WHERE LOWER(slug) = $1 OR LOWER(name) = $1 LIMIT 1',
    [normalized]
  );
  if (slugRows.length > 0) return slugRows[0];

  // Try alias match
  const { rows: aliasRows } = await db.query(
    'SELECT * FROM skills WHERE aliases @> $1::jsonb LIMIT 1',
    [JSON.stringify([normalized])]
  );
  if (aliasRows.length > 0) return aliasRows[0];

  return null;
}

/**
 * Deterministically compute candidate's Skill DNA from real PostgreSQL evidence
 * @param {number} candidateId
 * @returns {Promise<Object>} Explainable Skill DNA profile
 */
export async function calculateCandidateSkillDNA(candidateId) {
  // 1. Fetch candidate basic details and self-reported skills
  const { rows: candRows } = await db.query(
    'SELECT id, user_id, full_name, headline, skill_json FROM candidates WHERE id = $1',
    [candidateId]
  );
  if (!candRows[0]) {
    throw new Error(`Candidate ${candidateId} not found`);
  }
  const candidate = candRows[0];

  // Parse self-reported skills array
  let selfReportedSkills = [];
  if (Array.isArray(candidate.skill_json)) {
    selfReportedSkills = candidate.skill_json;
  } else if (typeof candidate.skill_json === 'string') {
    try {
      selfReportedSkills = JSON.parse(candidate.skill_json);
    } catch {
      selfReportedSkills = [];
    }
  }

  // 2. Fetch all formal evidence records for this candidate
  const { rows: evidenceRows } = await db.query(
    `SELECT e.*, s.slug as skill_slug, s.name as skill_name, s.category as skill_category,
            u.name as reviewer_name
     FROM skill_evidence e
     JOIN skills s ON e.skill_id = s.id
     LEFT JOIN users u ON e.reviewer_id = u.id
     WHERE e.candidate_id = $1 AND e.review_status != 'withdrawn'
     ORDER BY e.created_at ASC`,
    [candidateId]
  );

  // Group evidence by skill_id
  const evidenceBySkill = new Map();
  for (const ev of evidenceRows) {
    if (!evidenceBySkill.has(ev.skill_id)) {
      evidenceBySkill.set(ev.skill_id, []);
    }
    evidenceBySkill.get(ev.skill_id).push(ev);
  }

  // 3. Resolve any self-reported skills into canonical skill catalogue
  const allCanonicalSkills = await getCanonicalSkills();
  const canonicalMap = new Map();
  for (const s of allCanonicalSkills) {
    canonicalMap.set(s.id, s);
  }

  const evaluatedSkills = [];
  const processedSkillIds = new Set();

  // Evaluate skills with formal evidence records
  for (const [skillId, evList] of evidenceBySkill.entries()) {
    processedSkillIds.add(skillId);
    const skill = canonicalMap.get(skillId);
    if (!skill) continue;

    const evaluation = evaluateSingleSkill(skill, evList);
    evaluatedSkills.push(evaluation);
  }

  // Check self-reported skills that lack formal evidence records
  for (const skillName of selfReportedSkills) {
    const resolved = await resolveSkill(skillName);
    if (resolved && !processedSkillIds.has(resolved.id)) {
      processedSkillIds.add(resolved.id);
      // Evaluated as strictly unverified, self-reported baseline
      evaluatedSkills.push({
        skill_id: resolved.id,
        skill_slug: resolved.slug,
        slug: resolved.slug,
        skill_name: resolved.name,
        name: resolved.name,
        category: resolved.category,
        verification_status: 'unverified',
        confidence_score: EVIDENCE_CONFIDENCE_WEIGHTS.self_reported,
        confidence: EVIDENCE_CONFIDENCE_WEIGHTS.self_reported,
        proficiency_tier: 'Unassessed',
        proficiency_score: null,
        coverage: 'minimal',
        recency_days: 0,
        primary_evidence_source: 'self_reported',
        evidence_count: 1,
        evidence_items: [
          {
            source_type: 'self_reported',
            title: `Self-reported ${resolved.name} proficiency`,
            review_status: 'unreviewed',
            confidence: EVIDENCE_CONFIDENCE_WEIGHTS.self_reported,
            created_at: candidate.created_at || new Date().toISOString()
          }
        ],
        explanation: 'Skill is self-reported in candidate profile without external verification or completed assessments.'
      });
    }
  }

  // 4. Compute aggregate summary metrics
  const verifiedSkills = evaluatedSkills.filter(s => s.verification_status === 'verified');
  const pendingReviewSkills = evaluatedSkills.filter(s => s.verification_status === 'pending_review');
  const unverifiedSkills = evaluatedSkills.filter(s => s.verification_status === 'unverified');

  const averageConfidence = evaluatedSkills.length > 0
    ? Number((evaluatedSkills.reduce((acc, s) => acc + s.confidence_score, 0) / evaluatedSkills.length).toFixed(3))
    : 0.0;

  const overviewObj = {
    total_skills_tracked: evaluatedSkills.length,
    total_skills: evaluatedSkills.length,
    verified_skills_count: verifiedSkills.length,
    verified_count: verifiedSkills.length,
    pending_review_count: pendingReviewSkills.length,
    unverified_count: unverifiedSkills.length,
    average_confidence: averageConfidence,
    verification_ratio: evaluatedSkills.length > 0 ? Number((verifiedSkills.length / evaluatedSkills.length).toFixed(3)) : 0.0,
    overall_coverage: evaluatedSkills.length >= 5 ? (verifiedSkills.length >= 3 ? 'comprehensive' : 'partial') : 'minimal'
  };

  return {
    candidate_id: candidate.id,
    full_name: candidate.full_name,
    headline: candidate.headline,
    engine_version: SKILL_DNA_ENGINE_VERSION,
    calculated_at: new Date().toISOString(),
    overview: overviewObj,
    summary: overviewObj,
    skills: evaluatedSkills
  };
}

/**
 * Deterministic single-skill evaluation rule
 * Methodology: v1.1.0-deterministic-heuristic
 * - Source deduplication: Collapses identical source references / assessment IDs to prevent artificial compounding.
 * - Disentangled proficiency: Only assigns benchmark proficiency tiers when empirical assessment score exists; otherwise 'Unassessed'.
 * - Trust bounds: Unverified/self-reported confidence is bounded at 0.350 max.
 * - Recency: Computes recency_days from the latest evidence verification or submission timestamp.
 */
function evaluateSingleSkill(skill, evidenceList) {
  // Filter active valid evidence
  const validEvidence = evidenceList.filter(e => e.review_status !== 'rejected' && e.review_status !== 'withdrawn');
  const rejectedEvidence = evidenceList.filter(e => e.review_status === 'rejected');

  if (validEvidence.length === 0) {
    return {
      skill_id: skill.id,
      skill_slug: skill.slug,
      slug: skill.slug,
      skill_name: skill.name,
      name: skill.name,
      category: skill.category,
      verification_status: rejectedEvidence.length > 0 ? 'rejected' : 'insufficient_evidence',
      confidence_score: 0.0,
      confidence: 0.0,
      proficiency_tier: 'Unassessed',
      proficiency_score: null,
      coverage: 'none',
      recency_days: null,
      primary_evidence_source: null,
      evidence_count: 0,
      evidence_items: rejectedEvidence.map(mapEvidenceSummary),
      explanation: rejectedEvidence.length > 0
        ? 'All submitted evidence for this skill was rejected upon review.'
        : 'No valid evidence records found.'
    };
  }

  let hasVerifiedAssessment = false;
  let hasVerifiedFaculty = false;
  let hasVerifiedProject = false;
  let hasPendingReview = false;
  let highestScore = null;
  let primarySource = 'self_reported';

  // 1. Group evidence by underlying source to prevent duplicate contribution
  const sourceMap = new Map();

  for (const ev of validEvidence) {
    let sourceKey;
    if (ev.source_reference && ev.source_reference.trim()) {
      sourceKey = `ref:${ev.source_reference.trim().toLowerCase()}`;
    } else if (ev.source_type === 'assessment_result') {
      sourceKey = `assessment:${ev.evidence_metadata?.assessment_slug || ev.skill_id}`;
    } else if (ev.source_type === 'self_reported') {
      sourceKey = 'self_reported';
    } else {
      sourceKey = `evidence:${ev.id}`;
    }

    let weight = Number(ev.confidence_score) || 0.200;

    if (ev.source_type === 'assessment_result' && ev.review_status === 'verified') {
      hasVerifiedAssessment = true;
      weight = EVIDENCE_CONFIDENCE_WEIGHTS.assessment_result;
      const score = Number(ev.evidence_metadata?.score);
      if (!isNaN(score) && (highestScore === null || score > highestScore)) {
        highestScore = score;
      }
    } else if (ev.source_type === 'faculty_review' && ev.review_status === 'verified') {
      hasVerifiedFaculty = true;
      weight = EVIDENCE_CONFIDENCE_WEIGHTS.faculty_review;
    } else if (ev.source_type === 'project_submission' && ev.review_status === 'verified') {
      hasVerifiedProject = true;
      weight = EVIDENCE_CONFIDENCE_WEIGHTS.project_submission_verified;
    } else if (ev.review_status === 'pending_review') {
      hasPendingReview = true;
    }

    // Retain highest weight per distinct underlying source
    if (!sourceMap.has(sourceKey) || weight > sourceMap.get(sourceKey).weight) {
      sourceMap.set(sourceKey, { weight, ev });
    }
  }

  // 2. Calculate cumulative confidence using independent distinct sources: C = 1 - product(1 - c_i)
  let complementProduct = 1.0;
  for (const { weight } of sourceMap.values()) {
    complementProduct *= (1.0 - Math.min(weight, 0.95));
  }

  let aggregateConfidence = Number((1.0 - complementProduct).toFixed(3));

  // 3. Determine Verification Status
  let verificationStatus = 'unverified';
  if (hasVerifiedAssessment || hasVerifiedFaculty || hasVerifiedProject) {
    verificationStatus = 'verified';
  } else if (hasPendingReview) {
    verificationStatus = 'pending_review';
  }

  // Cap confidence if only self-reported / unreviewed evidence exists
  if (verificationStatus === 'unverified') {
    aggregateConfidence = Math.min(aggregateConfidence, 0.350);
  }

  // 4. Determine primary evidence source
  if (hasVerifiedAssessment) primarySource = 'assessment_result';
  else if (hasVerifiedFaculty) primarySource = 'faculty_review';
  else if (hasVerifiedProject) primarySource = 'project_submission';
  else if (hasPendingReview) primarySource = 'pending_review';
  else primarySource = validEvidence[0]?.source_type || 'self_reported';

  // 5. Determine proficiency tier (strictly decoupled from confidence!)
  // Proficiency is derived ONLY from empirical benchmark assessments or scored evaluations.
  let proficiencyTier = 'Unassessed';
  if (highestScore !== null) {
    if (highestScore >= 0.90) proficiencyTier = 'Advanced';
    else if (highestScore >= 0.70) proficiencyTier = 'Proficient';
    else if (highestScore >= 0.50) proficiencyTier = 'Competent';
    else proficiencyTier = 'Foundational';
  } else {
    // No benchmark assessment taken
    proficiencyTier = 'Unassessed';
  }

  // 6. Determine coverage
  let coverage = 'minimal';
  if (validEvidence.length >= 3 || (hasVerifiedAssessment && hasVerifiedFaculty)) {
    coverage = 'comprehensive';
  } else if (validEvidence.length >= 2 || hasVerifiedAssessment || hasVerifiedFaculty) {
    coverage = 'partial';
  }

  // 7. Calculate recency
  let recencyDays = null;
  const validDates = validEvidence
    .map(e => e.reviewed_at || e.created_at)
    .filter(Boolean)
    .map(d => new Date(d).getTime())
    .filter(t => !isNaN(t));

  if (validDates.length > 0) {
    const mostRecentMs = Math.max(...validDates);
    recencyDays = Math.max(0, Math.floor((Date.now() - mostRecentMs) / (1000 * 60 * 60 * 24)));
  }

  // Explanation string
  let explanation = '';
  if (hasVerifiedAssessment && hasVerifiedFaculty) {
    explanation = `Demonstrated via passed technical assessment (${(highestScore * 100).toFixed(0)}%) and verified faculty review.`;
  } else if (hasVerifiedAssessment) {
    explanation = `Objective proof established through passed SkillVerse technical benchmark (${(highestScore * 100).toFixed(0)}%).`;
  } else if (hasVerifiedFaculty) {
    explanation = `Academic competency verified by assigned faculty mentor.`;
  } else if (hasVerifiedProject) {
    explanation = `Verified through approved project repository code inspection.`;
  } else if (hasPendingReview) {
    explanation = `Evidence submitted and awaiting faculty mentorship review.`;
  } else {
    explanation = `Self-reported skill with unverified baseline confidence.`;
  }

  return {
    skill_id: skill.id,
    skill_slug: skill.slug,
    slug: skill.slug,
    skill_name: skill.name,
    name: skill.name,
    category: skill.category,
    verification_status: verificationStatus,
    confidence_score: aggregateConfidence,
    confidence: aggregateConfidence,
    proficiency_tier: proficiencyTier,
    proficiency_score: highestScore,
    coverage,
    recency_days: recencyDays,
    primary_evidence_source: primarySource,
    evidence_count: validEvidence.length,
    distinct_sources_count: sourceMap.size,
    evidence_items: validEvidence.map(mapEvidenceSummary),
    explanation
  };
}

function mapEvidenceSummary(ev) {
  return {
    id: ev.id,
    source_type: ev.source_type,
    title: ev.title,
    description: ev.description,
    source_reference: ev.source_reference,
    review_status: ev.review_status,
    reviewer_name: ev.reviewer_name || null,
    reviewed_at: ev.reviewed_at || null,
    review_feedback: ev.review_feedback || null,
    confidence: Number(ev.confidence_score) || 0.200,
    metadata: ev.evidence_metadata || {},
    created_at: ev.created_at
  };
}

/**
 * Submit candidate skill evidence
 */
export async function submitSkillEvidence({ candidateId, skillId, sourceType, title, description, sourceReference, metadata = {} }) {
  // Check for duplicate submission for the same candidate, source reference, and skill
  if (sourceReference) {
    const trimmedRef = sourceReference.trim();
    const { rows: existingRows } = await db.query(
      `SELECT * FROM skill_evidence 
       WHERE candidate_id = $1 AND source_reference = $2 AND skill_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [candidateId, trimmedRef, skillId]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.review_status === 'pending_review' || existing.review_status === 'unreviewed') {
        const { rows: updatedRows } = await db.query(
          `UPDATE skill_evidence 
           SET title = $1, description = $2, evidence_metadata = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [title.trim(), description ? description.trim() : null, metadata, existing.id]
        );
        return {
          ...updatedRows[0],
          duplicate_detected: true,
          status_action: 'updated_pending'
        };
      } else if (existing.review_status === 'verified') {
        return {
          ...existing,
          duplicate_detected: true,
          status_action: 'already_verified'
        };
      } else if (existing.review_status === 'rejected') {
        const err = new Error('This repository evidence was previously reviewed and rejected for this skill.');
        err.status = 409;
        err.existing = existing;
        throw err;
      }
    }
  }

  let initialStatus = 'unreviewed';
  let initialConfidence = EVIDENCE_CONFIDENCE_WEIGHTS.self_reported;

  if (sourceType === 'project_submission') {
    initialStatus = 'pending_review';
    initialConfidence = EVIDENCE_CONFIDENCE_WEIGHTS.project_submission;
  } else if (sourceType === 'assessment_result') {
    initialStatus = 'verified';
    initialConfidence = EVIDENCE_CONFIDENCE_WEIGHTS.assessment_result;
  }

  const { rows } = await db.query(
    `INSERT INTO skill_evidence 
      (candidate_id, skill_id, source_type, title, description, source_reference, review_status, confidence_score, evidence_metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [candidateId, skillId, sourceType, title.trim(), description ? description.trim() : null, sourceReference ? sourceReference.trim() : null, initialStatus, initialConfidence, metadata]
  );

  return rows[0];
}

/**
 * Faculty reviews a pending evidence record
 */
export async function reviewSkillEvidence({ evidenceId, reviewerUserId, decision, feedbackNotes }) {
  if (decision !== 'verified' && decision !== 'rejected') {
    throw new Error("Invalid review decision: must be 'verified' or 'rejected'");
  }

  // 1. Fetch evidence details and candidate user_id
  const { rows: evRows } = await db.query(
    `SELECT e.*, c.user_id as student_user_id
     FROM skill_evidence e
     JOIN candidates c ON e.candidate_id = c.id
     WHERE e.id = $1`,
    [evidenceId]
  );

  if (!evRows[0]) {
    throw new Error('Evidence record not found');
  }
  const evidence = evRows[0];

  // 2. Validate faculty-student mentorship assignment
  const { rows: assignRows } = await db.query(
    `SELECT * FROM faculty_student_assignments 
     WHERE faculty_id = $1 AND student_id = $2 AND status = 'active'`,
    [reviewerUserId, evidence.student_user_id]
  );

  // If reviewer is not assigned faculty, reject with forbidden
  if (assignRows.length === 0) {
    const error = new Error('Forbidden: You are not authorized to review evidence for unassigned students');
    error.status = 403;
    throw error;
  }

  // 3. Elevate confidence if verified, or reset if rejected
  const newConfidence = decision === 'verified'
    ? EVIDENCE_CONFIDENCE_WEIGHTS.project_submission_verified
    : 0.0;

  const { rows: updatedRows } = await db.query(
    `UPDATE skill_evidence
     SET review_status = $1,
         reviewer_id = $2,
         reviewed_at = CURRENT_TIMESTAMP,
         review_feedback = $3,
         confidence_score = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [decision, reviewerUserId, feedbackNotes ? feedbackNotes.trim() : null, newConfidence, evidenceId]
  );

  return updatedRows[0];
}
