// Backend/src/services/assessment.service.js
import { db } from '../config/db.js';
import { submitSkillEvidence } from './skill_dna.service.js';

/**
 * List all available technical assessments (safe public summary)
 */
export async function getAssessmentCatalog() {
  const { rows } = await db.query(
    `SELECT a.id, a.slug, a.title, a.description, a.version, 
            a.time_limit_minutes, a.pass_threshold,
            jsonb_array_length(a.questions_json) as question_count,
            s.slug as skill_slug, s.name as skill_name, s.category as skill_category
     FROM assessments a
     JOIN skills s ON a.skill_id = s.id
     ORDER BY s.category ASC, a.title ASC`
  );

  return rows.map(r => ({
    ...r,
    pass_threshold: Number(r.pass_threshold),
    passing_score: Math.round(Number(r.pass_threshold) * 100),
    question_count: Number(r.question_count),
    total_questions: Number(r.question_count),
    category: r.skill_category
  }));
}

/**
 * Retrieve an assessment by slug with questions
 * STRICT SECURITY GUARANTEE: `answer_keys_json` is never selected or exposed to client!
 */
export async function getAssessmentBySlug(slug) {
  const { rows } = await db.query(
    `SELECT a.id, a.slug, a.title, a.description, a.version,
            a.time_limit_minutes, a.pass_threshold, a.questions_json,
            s.slug as skill_slug, s.name as skill_name, s.category as skill_category
     FROM assessments a
     JOIN skills s ON a.skill_id = s.id
     WHERE a.slug = $1`,
    [slug]
  );

  if (!rows[0]) return null;

  const assessment = rows[0];
  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    description: assessment.description,
    version: assessment.version,
    time_limit_minutes: assessment.time_limit_minutes,
    pass_threshold: Number(assessment.pass_threshold),
    passing_score: Math.round(Number(assessment.pass_threshold) * 100),
    total_questions: Array.isArray(assessment.questions_json) ? assessment.questions_json.length : 0,
    skill_slug: assessment.skill_slug,
    category: assessment.skill_category,
    skill: {
      slug: assessment.skill_slug,
      name: assessment.skill_name,
      category: assessment.skill_category
    },
    questions: assessment.questions_json
  };
}

/**
 * Submit and grade a candidate's assessment attempt server-side
 */
export async function submitAssessmentAttempt({ candidateId, slug, answers, durationSeconds = 0 }) {
  if (!answers || typeof answers !== 'object') {
    throw new Error('Invalid submission: answers object is required');
  }

  // 1. Fetch full assessment definition WITH answer keys (server-side only)
  const { rows } = await db.query(
    `SELECT a.*, s.name as skill_name, s.id as skill_id 
     FROM assessments a
     JOIN skills s ON a.skill_id = s.id
     WHERE a.slug = $1`,
    [slug]
  );

  if (!rows[0]) {
    throw new Error(`Assessment '${slug}' not found`);
  }
  const assessment = rows[0];
  const questions = assessment.questions_json || [];
  const answerKeys = assessment.answer_keys_json || {};

  if (questions.length === 0) {
    throw new Error('Assessment contains no questions to score');
  }

  // 2. Validate and score answers server-side
  let correctCount = 0;
  for (const q of questions) {
    const qid = q.id;
    const submittedChoice = (answers[qid] || '').toString().trim().toLowerCase();
    const correctChoice = (answerKeys[qid] || '').toString().trim().toLowerCase();

    if (submittedChoice && submittedChoice === correctChoice) {
      correctCount++;
    }
  }

  const rawScore = Number((correctCount / questions.length).toFixed(3));
  const passThreshold = Number(assessment.pass_threshold);
  const passed = rawScore >= passThreshold;

  // 3. Persist attempt record to PostgreSQL
  const { rows: attemptRows } = await db.query(
    `INSERT INTO assessment_attempts 
      (candidate_id, assessment_id, assessment_version, score, passed, answers_submitted, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, score, passed, completed_at`,
    [candidateId, assessment.id, assessment.version, rawScore, passed, JSON.stringify(answers), Number(durationSeconds) || 0]
  );

  const attempt = attemptRows[0];

  // 4. If passed, automatically record / update verified skill evidence
  let evidenceRecord = null;
  if (passed) {
    const { rows: existingEv } = await db.query(
      `SELECT id, confidence_score, evidence_metadata 
       FROM skill_evidence 
       WHERE candidate_id = $1 AND skill_id = $2 AND source_type = 'assessment_result'`,
      [candidateId, assessment.skill_id]
    );

    const metadata = {
      assessment_slug: slug,
      assessment_title: assessment.title,
      assessment_version: assessment.version,
      attempt_id: attempt.id,
      score: rawScore,
      passed_at: attempt.completed_at
    };

    if (existingEv.length > 0) {
      // Update existing assessment evidence
      const { rows: updatedEv } = await db.query(
        `UPDATE skill_evidence
         SET title = $1,
             source_reference = $2,
             review_status = 'verified',
             confidence_score = 0.850,
             evidence_metadata = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [
          `Passed ${assessment.title} (Score: ${(rawScore * 100).toFixed(0)}%)`,
          `attempt:${attempt.id}`,
          JSON.stringify(metadata),
          existingEv[0].id
        ]
      );
      evidenceRecord = updatedEv[0];
    } else {
      // Create new evidence record
      evidenceRecord = await submitSkillEvidence({
        candidateId,
        skillId: assessment.skill_id,
        sourceType: 'assessment_result',
        title: `Passed ${assessment.title} (Score: ${(rawScore * 100).toFixed(0)}%)`,
        description: `Candidate achieved ${(rawScore * 100).toFixed(0)}% passing score on the SkillVerse ${assessment.title}.`,
        sourceReference: `attempt:${attempt.id}`,
        metadata
      });
    }
  }

  return {
    attempt_id: attempt.id,
    assessment_slug: slug,
    assessment_title: assessment.title,
    skill_name: assessment.skill_name,
    total_questions: questions.length,
    correct_answers: correctCount,
    score: rawScore,
    pass_threshold: passThreshold,
    passed,
    completed_at: attempt.completed_at,
    verified_evidence_id: evidenceRecord?.id || null
  };
}

/**
 * Get all past assessment attempts for a candidate
 */
export async function getCandidateAttempts(candidateId) {
  const { rows } = await db.query(
    `SELECT aa.id as attempt_id, aa.id, aa.assessment_version, aa.score, aa.passed,
            aa.duration_seconds, aa.completed_at, aa.completed_at as attempted_at,
            a.slug as assessment_slug, a.title as assessment_title, a.title,
            s.slug as skill_slug, s.name as skill_name, s.category as skill_category
     FROM assessment_attempts aa
     JOIN assessments a ON aa.assessment_id = a.id
     JOIN skills s ON a.skill_id = s.id
     WHERE aa.candidate_id = $1
     ORDER BY aa.completed_at DESC`,
    [candidateId]
  );

  return rows.map(r => ({
    ...r,
    score: Number(r.score)
  }));
}
