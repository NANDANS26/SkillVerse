// Backend/src/services/roadmap.service.js
import { db } from '../config/db.js';
import { calculateCandidateSkillDNA, resolveSkill } from './skill_dna.service.js';
import { getCandidateAttempts } from './assessment.service.js';
import { callMLToRecommendActivities } from './ml.service.js';

export const ROADMAP_ENGINE_VERSION = 'v2.0.0-ai-semantic-recommendation';

/**
 * Standard predefined career goal profiles for easy student onboarding
 */
export const PREDEFINED_CAREER_ROLES = [
  {
    role_key: 'distributed_systems_engineer',
    title: 'Distributed Systems & Cloud Engineer',
    description: 'Specializes in high-concurrency systems, consensus protocols, and fault-tolerant cloud backends.',
    skills: ['distributed-systems', 'rust', 'python', 'docker', 'postgresql']
  },
  {
    role_key: 'backend_platform_architect',
    title: 'Backend Platform & API Architect',
    description: 'Designs resilient REST/gRPC services, database architectures, and asynchronous event streams.',
    skills: ['python', 'fastapi', 'postgresql', 'docker', 'security']
  },
  {
    role_key: 'systems_software_engineer',
    title: 'Low-Latency Systems & Network Engineer',
    description: 'Focuses on systems-level programming, memory safety, concurrency, and performance optimization.',
    skills: ['rust', 'go', 'distributed-systems', 'docker', 'security']
  },
  {
    role_key: 'fullstack_web_architect',
    title: 'Full-Stack Web & Cloud Developer',
    description: 'Builds end-to-end applications combining accessible responsive frontends with robust backend APIs.',
    skills: ['react', 'python', 'fastapi', 'postgresql', 'docker']
  }
];

/**
 * Fetch the active goal for a candidate
 */
export async function getStudentGoal(candidateId) {
  const { rows } = await db.query(
    `SELECT g.*, j.title as job_title, j.location as job_location, c.name as company_name
     FROM student_goals g
     LEFT JOIN jobs j ON g.target_job_id = j.id
     LEFT JOIN companies c ON j.company_id = c.id
     WHERE g.candidate_id = $1 AND g.status = 'active'
     ORDER BY g.created_at DESC
     LIMIT 1`,
    [candidateId]
  );
  return rows[0] || null;
}

/**
 * Set or replace the candidate's active target goal
 */
export async function setStudentGoal({ candidateId, goalType = 'target_role', targetTitle, targetJobId = null, targetSkills = [] }) {
  if (!targetTitle && !targetJobId) {
    throw new Error('A target role title or target job id is required to set a goal');
  }

  let finalTitle = targetTitle;
  let finalSkills = Array.isArray(targetSkills) ? targetSkills : [];

  // If target_job_id provided, derive skills and title from persisted job with visibility check
  if (targetJobId) {
    const { rows: jobRows } = await db.query(
      `SELECT id, title, location, parsed_json, status FROM jobs WHERE id = $1`,
      [targetJobId]
    );

    if (!jobRows[0]) {
      const err = new Error(`Target job with id ${targetJobId} not found`);
      err.status = 404;
      throw err;
    }

    const job = jobRows[0];
    if (job.status && job.status !== 'active' && job.status !== 'open') {
      const err = new Error(`Target job with id ${targetJobId} is not an active open requisition`);
      err.status = 400;
      throw err;
    }

    if (!finalTitle) {
      finalTitle = job.title;
    }

    // Extract skills from job parsed_json if not explicitly specified
    if (finalSkills.length === 0 && job.parsed_json && Array.isArray(job.parsed_json.skills)) {
      finalSkills = job.parsed_json.skills;
    }
  }

  // If selecting a predefined role preset and no skills given, look up preset skills
  if (finalSkills.length === 0) {
    const preset = PREDEFINED_CAREER_ROLES.find(r => r.title.toLowerCase() === finalTitle.toLowerCase() || r.role_key === finalTitle.toLowerCase());
    if (preset) {
      finalSkills = preset.skills;
      finalTitle = preset.title;
    }
  }

  // Sanitize and filter empty/malformed skill values
  finalSkills = finalSkills
    .map(s => (typeof s === 'string' ? s.trim() : (s?.name || s?.slug || '')).trim())
    .filter(Boolean);

  // Archive any existing active goals for this candidate
  await db.query(
    `UPDATE student_goals SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE candidate_id = $1 AND status = 'active'`,
    [candidateId]
  );

  // Insert fresh active goal
  const { rows } = await db.query(
    `INSERT INTO student_goals (candidate_id, goal_type, target_title, target_job_id, target_skills, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING *`,
    [candidateId, goalType, finalTitle.trim(), targetJobId || null, JSON.stringify(finalSkills)]
  );

  return rows[0];
}

/**
 * Deterministically analyze skill gaps between candidate's evidence and target goal
 */
export async function analyzeSkillGaps(candidateId, goal) {
  // 1. Fetch live candidate Skill DNA (versioned v1.1.0-deterministic-heuristic)
  const dna = await calculateCandidateSkillDNA(candidateId);
  const dnaSkillsMap = new Map();
  for (const s of dna.skills) {
    dnaSkillsMap.set(s.skill_id, s);
    dnaSkillsMap.set(s.slug, s);
  }

  // 2. Fetch past assessment attempts for this candidate
  const attempts = await getCandidateAttempts(candidateId);
  const attemptsBySkill = new Map();
  for (const a of attempts) {
    if (!attemptsBySkill.has(a.skill_slug)) {
      attemptsBySkill.set(a.skill_slug, []);
    }
    attemptsBySkill.get(a.skill_slug).push(a);
  }

  // 3. Parse target skills from goal
  let targetSkillList = [];
  if (Array.isArray(goal.target_skills)) {
    targetSkillList = goal.target_skills;
  } else if (typeof goal.target_skills === 'string') {
    try {
      targetSkillList = JSON.parse(goal.target_skills);
    } catch {
      targetSkillList = [];
    }
  }

  // 4. Evaluate each target skill deterministically with alias deduplication
  const gapResults = [];
  const seenCanonicalSkillIds = new Map(); // skill_id -> index in gapResults
  const seenUnresolved = new Set(); // lowercase string set
  let supportedCount = 0;
  let developmentNeededCount = 0;
  let unassessedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let unresolvedCount = 0;

  for (const targetItem of targetSkillList) {
    const rawSkillName = typeof targetItem === 'string' ? targetItem.trim() : String(targetItem?.name || targetItem?.slug || '').trim();
    if (!rawSkillName) continue;

    // Resolve against canonical skills catalogue
    const resolvedSkill = await resolveSkill(rawSkillName);

    if (!resolvedSkill) {
      // Unresolved requirement: cannot map to canonical catalog
      const lowerReq = rawSkillName.toLowerCase();
      if (seenUnresolved.has(lowerReq)) {
        continue; // Deduplicate repeated non-canonical requirements
      }
      seenUnresolved.add(lowerReq);
      unresolvedCount++;

      gapResults.push({
        target_requirement: rawSkillName,
        skill_id: null,
        skill_slug: null,
        skill_name: rawSkillName,
        aliases_requested: [],
        category: 'Unmapped Requirement',
        gap_state: 'requirement_unresolved',
        status_label: 'Unresolved Requirement',
        evidence_considered: 'No canonical skill match found in platform taxonomy',
        missing_elements: ['Standard canonical skill taxonomy mapping'],
        rationale: `The target requirement '${rawSkillName}' cannot yet be reliably mapped to the platform's canonical skill taxonomy.`,
        actionable_next_step: 'Submit custom project proof or request academic advisor to map this requirement.'
      });
      continue;
    }

    // Skill is canonically resolved
    if (seenCanonicalSkillIds.has(resolvedSkill.id)) {
      // Multiple target requirements mapped to the same canonical skill - preserve alias without duplicating gap row
      const existingIdx = seenCanonicalSkillIds.get(resolvedSkill.id);
      const existingGap = gapResults[existingIdx];
      if (existingGap && rawSkillName !== existingGap.target_requirement && !existingGap.aliases_requested.includes(rawSkillName)) {
        existingGap.aliases_requested.push(rawSkillName);
      }
      continue;
    }

    seenCanonicalSkillIds.set(resolvedSkill.id, gapResults.length);

    const skillSlug = resolvedSkill.slug;
    const dnaSkill = dnaSkillsMap.get(resolvedSkill.id) || dnaSkillsMap.get(skillSlug);
    const skillAttempts = attemptsBySkill.get(skillSlug) || [];

    const hasPassedBenchmark = skillAttempts.some(a => a.passed === true);
    const latestAttempt = skillAttempts[0] || null;
    const hasFailedBenchmark = latestAttempt && latestAttempt.passed === false && !hasPassedBenchmark;
    const verificationStatus = dnaSkill?.verification_status || 'unverified';

    let gapState = 'unassessed';
    let statusLabel = 'Unassessed';
    let evidenceConsidered = '';
    let missingElements = [];
    let rationale = '';
    let actionableNextStep = '';

    if (hasPassedBenchmark || verificationStatus === 'verified') {
      gapState = 'evidence_supports_target';
      statusLabel = 'Evidence Supports Target';
      supportedCount++;
      const scoreText = dnaSkill?.proficiency_score !== null && dnaSkill?.proficiency_score !== undefined
        ? ` (Score: ${(dnaSkill.proficiency_score * 100).toFixed(0)}%)` 
        : '';
      evidenceConsidered = hasPassedBenchmark
        ? `Passed standardized benchmark${scoreText}`
        : `Verified faculty review of project code`;
      missingElements = [];
      rationale = `Demonstrated competency established via passing technical benchmark or verified faculty evaluation. Confidence: ${Math.round((dnaSkill?.confidence || 0.85) * 100)}%.`;
      actionableNextStep = 'Maintain recency and explore advanced architecture challenges.';
    } else if (hasFailedBenchmark) {
      gapState = 'development_indicated';
      statusLabel = 'Development Indicated';
      developmentNeededCount++;
      evidenceConsidered = `Latest benchmark attempt scored ${(latestAttempt.score * 100).toFixed(0)}% (below pass threshold)`;
      missingElements = ['Demonstrated passing mastery on benchmark concepts'];
      rationale = `Candidate completed benchmark assessment but scored ${(latestAttempt.score * 100).toFixed(0)}%, indicating a specific conceptual development need.`;
      actionableNextStep = 'Review key technical concepts and retake the benchmark assessment.';
    } else if (verificationStatus === 'pending_review') {
      gapState = 'evidence_pending';
      statusLabel = 'Evidence Pending Review';
      pendingCount++;
      evidenceConsidered = 'Project repository submitted and awaiting faculty mentorship evaluation';
      missingElements = ['Assigned faculty mentor review decision'];
      rationale = 'Evidence is submitted in platform but has not yet completed the faculty verification lifecycle.';
      actionableNextStep = 'Follow up with your assigned faculty mentor to complete code review.';
    } else if (verificationStatus === 'rejected') {
      gapState = 'evidence_rejected';
      statusLabel = 'Evidence Rejected';
      rejectedCount++;
      evidenceConsidered = 'Prior submitted evidence was rejected upon faculty review';
      missingElements = ['Revised project proof addressing faculty feedback'];
      rationale = 'Submitted project evidence was reviewed and rejected. Revised implementation is required.';
      actionableNextStep = 'Address reviewer feedback in your repository and submit fresh project proof.';
    } else {
      // Default: Unassessed
      gapState = 'unassessed';
      statusLabel = 'Unassessed';
      unassessedCount++;
      evidenceConsidered = dnaSkill ? 'Self-reported in candidate profile without objective testing' : 'No prior evidence recorded';
      missingElements = ['Standardized technical assessment or verified project repository'];
      rationale = 'The platform lacks sufficient assessment or verified project evidence to evaluate proficiency. This represents an unassessed opportunity, not a proven weakness.';
      actionableNextStep = 'Take the in-platform standardized benchmark or submit verified repository evidence.';
    }

    gapResults.push({
      target_requirement: rawSkillName,
      skill_id: resolvedSkill.id,
      skill_slug: resolvedSkill.slug,
      skill_name: resolvedSkill.name,
      aliases_requested: [],
      category: resolvedSkill.category,
      gap_state: gapState,
      status_label: statusLabel,
      evidence_considered: evidenceConsidered,
      missing_elements: missingElements,
      rationale,
      actionable_next_step: actionableNextStep,
      confidence_score: dnaSkill ? dnaSkill.confidence_score : 0.0,
      proficiency_tier: dnaSkill ? dnaSkill.proficiency_tier : 'Unassessed',
      verification_status: verificationStatus
    });
  }

  const totalSkills = gapResults.length;
  const readinessScore = totalSkills > 0 ? Number(((supportedCount / totalSkills) * 100).toFixed(1)) : 0.0;
  const isInsufficientEvidence = totalSkills > 0 && supportedCount === 0 && developmentNeededCount === 0 && pendingCount === 0 && rejectedCount === 0;

  const summary = {
    total_target_skills: totalSkills,
    supported_count: supportedCount,
    development_needed_count: developmentNeededCount,
    unassessed_count: unassessedCount,
    pending_count: pendingCount,
    rejected_count: rejectedCount,
    unresolved_count: unresolvedCount,
    readiness_score: readinessScore,
    is_insufficient_evidence: isInsufficientEvidence,
    sufficiency_status: isInsufficientEvidence ? 'insufficient_evidence' : 'computed',
    score_label: isInsufficientEvidence ? 'Insufficient Assessment Evidence (0%)' : `${readinessScore}%`,
    disclaimer: 'Transparent heuristic coverage indicator of demonstrated empirical benchmark or faculty-verified alignment. Not a hiring guarantee or employer evaluation replacement.'
  };

  return {
    goal,
    readiness_score: readinessScore,
    summary,
    gaps: gapResults
  };
}

/**
 * Deterministically generate and persist development roadmap recommendations
 */
export async function generateDevelopmentRoadmap(candidateId) {
  // 1. Get active goal
  const goal = await getStudentGoal(candidateId);
  if (!goal) {
    throw new Error('No active target goal configured for candidate. Please select a career goal or target job first.');
  }

  // 2. Compute explainable skill gaps
  const gapAnalysis = await analyzeSkillGaps(candidateId, goal);

  // 3. Query all available in-platform learning activities
  const { rows: activities } = await db.query(
    `SELECT a.*, s.slug as skill_slug, s.name as skill_name, s.category as skill_category
     FROM learning_activities a
     JOIN skills s ON a.skill_id = s.id
     ORDER BY a.difficulty ASC`
  );
  const activitiesBySkill = new Map();
  for (const act of activities) {
    if (!activitiesBySkill.has(act.skill_id)) {
      activitiesBySkill.set(act.skill_id, []);
    }
    activitiesBySkill.get(act.skill_id).push(act);
  }

  // 4. Formulate recommendations: First attempt AI semantic microservice, fallback to deterministic rules if offline
  const studentContext = {
    candidate_id: candidateId,
    target_title: goal.target_title,
    target_skills: goal.target_skills || [],
    readiness_score: gapAnalysis.readiness_score,
    gaps: gapAnalysis.gaps.map(g => ({
      target_requirement: g.target_requirement,
      skill_id: g.skill_id,
      skill_slug: g.skill_slug,
      skill_name: g.skill_name,
      gap_state: g.gap_state,
      confidence_score: g.confidence_score,
      proficiency_tier: g.proficiency_tier,
      verification_status: g.verification_status,
      missing_elements: g.missing_elements,
      rationale: g.rationale
    }))
  };

  let aiResult = null;
  let fallbackUsed = false;
  let fallbackReason = null;

  try {
    aiResult = await callMLToRecommendActivities({
      studentContext,
      candidateActivities: activities,
      topK: Math.max(10, gapAnalysis.gaps.length * 3)
    });
  } catch (err) {
    console.warn(`[RoadmapService] AI microservice unavailable, using deterministic fallback: ${err.message}`);
    fallbackUsed = true;
    fallbackReason = err.message;
  }

  // Map AI recommendations by activity_id for fast lookup
  const aiRecsByActivityId = new Map();
  if (aiResult && aiResult.success && Array.isArray(aiResult.recommendations)) {
    for (const rec of aiResult.recommendations) {
      aiRecsByActivityId.set(rec.activity_id, rec);
    }
  }

  const recommendationItems = [];

  for (const gap of gapAnalysis.gaps) {
    if (!gap.skill_id) {
      // Unresolved requirement
      recommendationItems.push({
        skill_id: null,
        activity_id: null,
        recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:req_${gap.target_requirement.replace(/\s+/g, '_').toLowerCase()}:unresolved`,
        recommendation_type: 'submit_evidence',
        priority: 4,
        title: `Clarify Evidence for ${gap.target_requirement}`,
        action_text: `Submit custom project repository proof for '${gap.target_requirement}' to map this non-standard requirement.`,
        rationale: gap.rationale,
        recommendation_metadata: {
          is_ai_recommended: false,
          advisory_type: 'unresolved_requirement',
          retrieval_method: fallbackUsed ? 'deterministic_heuristic' : 'SentenceTransformer-Cosine + MultiFactor-Ranker'
        }
      });
      continue;
    }

    const skillActs = activitiesBySkill.get(gap.skill_id) || [];
    const assessmentAct = skillActs.find(a => a.activity_type === 'assessment');
    const projectAct = skillActs.find(a => a.activity_type === 'practice_project');
    const challengeAct = skillActs.find(a => a.activity_type === 'code_challenge');

    if (gap.gap_state === 'development_indicated') {
      // Priority 1: Demonstrated development need
      if (assessmentAct) {
        const aiRec = aiRecsByActivityId.get(assessmentAct.id);
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: assessmentAct.id,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:retake_assessment`,
          recommendation_type: 'retake_assessment',
          priority: 1,
          title: `Review Concepts & Retake ${gap.skill_name} Benchmark`,
          action_text: aiRec?.explanation?.primary_driver || `Review technical fundamentals and retake the ${assessmentAct.title} to establish passing verified evidence.`,
          rationale: aiRec?.explanation?.rationale_text || gap.rationale,
          recommendation_metadata: aiRec ? {
            is_ai_recommended: true,
            ranking_score: aiRec.ranking_score,
            semantic_similarity: aiRec.semantic_similarity,
            scoring_breakdown: aiRec.scoring_breakdown,
            explanation: aiRec.explanation,
            model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
            retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
          } : {
            is_ai_recommended: false,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason
          }
        });
      } else if (projectAct) {
        const aiRec = aiRecsByActivityId.get(projectAct.id);
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: projectAct.id,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:targeted_practice`,
          recommendation_type: 'practice_project',
          priority: 1,
          title: `Build Targeted Practice Project in ${gap.skill_name}`,
          action_text: aiRec?.explanation?.primary_driver || `Complete '${projectAct.title}' to address demonstrated conceptual gaps.`,
          rationale: aiRec?.explanation?.rationale_text || gap.rationale,
          recommendation_metadata: aiRec ? {
            is_ai_recommended: true,
            ranking_score: aiRec.ranking_score,
            semantic_similarity: aiRec.semantic_similarity,
            scoring_breakdown: aiRec.scoring_breakdown,
            explanation: aiRec.explanation,
            model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
            retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
          } : {
            is_ai_recommended: false,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason
          }
        });
      }
    } else if (gap.gap_state === 'unassessed') {
      // Priority 2: Unassessed with benchmark available
      if (assessmentAct) {
        const aiRec = aiRecsByActivityId.get(assessmentAct.id);
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: assessmentAct.id,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:take_assessment`,
          recommendation_type: 'take_assessment',
          priority: 2,
          title: `Take ${gap.skill_name} Standardized Benchmark`,
          action_text: aiRec?.explanation?.primary_driver || `Complete the ${assessmentAct.title} (${assessmentAct.estimated_minutes} mins) to convert unassessed requirement into verified Skill DNA evidence.`,
          rationale: aiRec?.explanation?.rationale_text || gap.rationale,
          recommendation_metadata: aiRec ? {
            is_ai_recommended: true,
            ranking_score: aiRec.ranking_score,
            semantic_similarity: aiRec.semantic_similarity,
            scoring_breakdown: aiRec.scoring_breakdown,
            explanation: aiRec.explanation,
            model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
            retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
          } : {
            is_ai_recommended: false,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason
          }
        });
      } else if (projectAct) {
        // Priority 4: Unassessed without benchmark -> Build Practice Project
        const aiRec = aiRecsByActivityId.get(projectAct.id);
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: projectAct.id,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:practice_project`,
          recommendation_type: 'practice_project',
          priority: 4,
          title: `Build ${projectAct.title}`,
          action_text: aiRec?.explanation?.primary_driver || `Complete '${projectAct.title}' and submit repository proof for faculty mentorship evaluation.`,
          rationale: aiRec?.explanation?.rationale_text || gap.rationale,
          recommendation_metadata: aiRec ? {
            is_ai_recommended: true,
            ranking_score: aiRec.ranking_score,
            semantic_similarity: aiRec.semantic_similarity,
            scoring_breakdown: aiRec.scoring_breakdown,
            explanation: aiRec.explanation,
            model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
            retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
          } : {
            is_ai_recommended: false,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason
          }
        });
      } else {
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: null,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:submit_evidence`,
          recommendation_type: 'submit_evidence',
          priority: 4,
          title: `Submit Project Evidence for ${gap.skill_name}`,
          action_text: `Submit a public repository URL demonstrating ${gap.skill_name} code implementation.`,
          rationale: gap.rationale,
          recommendation_metadata: {
            is_ai_recommended: false,
            advisory_type: 'unassessed_missing_catalog',
            fallback_used: fallbackUsed
          }
        });
      }
    } else if (gap.gap_state === 'evidence_pending') {
      // Priority 3: Pending review
      recommendationItems.push({
        skill_id: gap.skill_id,
        activity_id: null,
        recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:request_review`,
        recommendation_type: 'request_review',
        priority: 3,
        title: `Faculty Review Follow-Up for ${gap.skill_name}`,
        action_text: `Engage with your assigned faculty advisor to review and verify your submitted ${gap.skill_name} project.`,
        rationale: gap.rationale,
        recommendation_metadata: {
          is_ai_recommended: false,
          advisory_type: 'evidence_pending_review'
        }
      });
    } else if (gap.gap_state === 'evidence_rejected') {
      // Priority 3: Rejected evidence -> revise and resubmit
      const aiRec = projectAct ? aiRecsByActivityId.get(projectAct.id) : null;
      recommendationItems.push({
        skill_id: gap.skill_id,
        activity_id: projectAct?.id || null,
        recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:revise_evidence`,
        recommendation_type: 'submit_evidence',
        priority: 3,
        title: `Revise and Resubmit ${gap.skill_name} Project Proof`,
        action_text: `Refactor your implementation addressing faculty feedback notes and submit revised repository link.`,
        rationale: gap.rationale,
        recommendation_metadata: aiRec ? {
          is_ai_recommended: true,
          ranking_score: aiRec.ranking_score,
          semantic_similarity: aiRec.semantic_similarity,
          scoring_breakdown: aiRec.scoring_breakdown,
          explanation: aiRec.explanation,
          model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
          retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
        } : {
          is_ai_recommended: false,
          fallback_used: fallbackUsed
        }
      });
    } else if (gap.gap_state === 'evidence_supports_target') {
      // Priority 5: Already supported -> Maintain active recency
      const advancedAct = challengeAct || projectAct;
      if (advancedAct) {
        const aiRec = aiRecsByActivityId.get(advancedAct.id);
        recommendationItems.push({
          skill_id: gap.skill_id,
          activity_id: advancedAct.id,
          recommendation_key: `rec:cand_${candidateId}:goal_${goal.id}:skill_${gap.skill_slug}:advanced_challenge`,
          recommendation_type: 'practice_project',
          priority: 5,
          title: `Advanced Challenge: ${advancedAct.title}`,
          action_text: aiRec?.explanation?.primary_driver || `Solidify your verified ${gap.skill_name} mastery by tackling an advanced production challenge.`,
          rationale: aiRec?.explanation?.rationale_text || `Goal competency is already verified. Completing advanced tasks maintains evidence recency.`,
          recommendation_metadata: aiRec ? {
            is_ai_recommended: true,
            ranking_score: aiRec.ranking_score,
            semantic_similarity: aiRec.semantic_similarity,
            scoring_breakdown: aiRec.scoring_breakdown,
            explanation: aiRec.explanation,
            model_version: aiResult.model_version || 'all-MiniLM-L6-v2',
            retrieval_method: aiResult.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'
          } : {
            is_ai_recommended: false,
            fallback_used: fallbackUsed
          }
        });
      }
    }
  }

  // Sort recommendations by priority ascending (1 = highest urgency), then by AI ranking score descending
  recommendationItems.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    const scoreA = a.recommendation_metadata?.ranking_score || 0;
    const scoreB = b.recommendation_metadata?.ranking_score || 0;
    return scoreB - scoreA;
  });

  // 5. Persist development roadmap in PostgreSQL
  const engineVersion = ROADMAP_ENGINE_VERSION;
  const modelMetadata = {
    engine_version: engineVersion,
    model_version: fallbackUsed ? 'none' : (aiResult?.model_version || 'all-MiniLM-L6-v2'),
    retrieval_method: fallbackUsed ? 'deterministic_heuristic' : (aiResult?.retrieval_method || 'SentenceTransformer-Cosine + MultiFactor-Ranker'),
    fallback_used: fallbackUsed,
    fallback_reason: fallbackReason
  };

  const { rows: existingRoadmaps } = await db.query(
    `SELECT id FROM development_roadmaps 
     WHERE candidate_id = $1 AND goal_id = $2 
     ORDER BY created_at DESC LIMIT 1`,
    [candidateId, goal.id]
  );

  let roadmap;
  if (existingRoadmaps[0]) {
    const { rows: updatedRoadmaps } = await db.query(
      `UPDATE development_roadmaps
       SET engine_version = $1,
           readiness_score = $2,
           gap_analysis_json = $3,
           summary_json = $4,
           model_metadata = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [engineVersion, gapAnalysis.readiness_score, JSON.stringify(gapAnalysis.gaps), JSON.stringify(gapAnalysis.summary), JSON.stringify(modelMetadata), existingRoadmaps[0].id]
    );
    roadmap = updatedRoadmaps[0];
  } else {
    const { rows: roadmapRows } = await db.query(
      `INSERT INTO development_roadmaps (candidate_id, goal_id, engine_version, readiness_score, gap_analysis_json, summary_json, model_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [candidateId, goal.id, engineVersion, gapAnalysis.readiness_score, JSON.stringify(gapAnalysis.gaps), JSON.stringify(gapAnalysis.summary), JSON.stringify(modelMetadata)]
    );
    roadmap = roadmapRows[0];
  }

  // 6. Persist individual recommendations with idempotent upsert (preserving student progress status)
  const savedRecs = [];
  const currentKeys = [];
  for (const item of recommendationItems) {
    currentKeys.push(item.recommendation_key);
    const { rows: recRows } = await db.query(
      `INSERT INTO roadmap_recommendations 
        (roadmap_id, candidate_id, skill_id, activity_id, recommendation_key, recommendation_type, priority, title, action_text, rationale, status, recommendation_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11)
       ON CONFLICT (roadmap_id, recommendation_key) 
       DO UPDATE SET 
         title = EXCLUDED.title,
         action_text = EXCLUDED.action_text,
         rationale = EXCLUDED.rationale,
         priority = EXCLUDED.priority,
         recommendation_metadata = EXCLUDED.recommendation_metadata,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [roadmap.id, candidateId, item.skill_id, item.activity_id, item.recommendation_key, item.recommendation_type, item.priority, item.title, item.action_text, item.rationale, JSON.stringify(item.recommendation_metadata || {})]
    );
    savedRecs.push(recRows[0]);
  }

  // 7. Transition obsolete active recommendations that are no longer part of current gap analysis
  if (currentKeys.length > 0) {
    await db.query(
      `UPDATE roadmap_recommendations
       SET status = 'superseded', updated_at = CURRENT_TIMESTAMP
       WHERE roadmap_id = $1 AND recommendation_key != ALL($2::text[]) AND status = 'active'`,
      [roadmap.id, currentKeys]
    );
  }

  return {
    roadmap_id: roadmap.id,
    candidate_id: candidateId,
    goal,
    engine_version: engineVersion,
    model_metadata: modelMetadata,
    readiness_score: gapAnalysis.readiness_score,
    summary: gapAnalysis.summary,
    gaps: gapAnalysis.gaps,
    recommendations: savedRecs,
    generated_at: roadmap.created_at
  };
}

/**
 * Retrieve the current roadmap, gaps, and recommendations for a candidate
 */
export async function getStudentRoadmap(candidateId) {
  const goal = await getStudentGoal(candidateId);
  if (!goal) {
    return {
      has_goal: false,
      goal: null,
      readiness_score: 0.0,
      summary: null,
      gaps: [],
      recommendations: []
    };
  }

  // Find latest roadmap for this goal
  const { rows: roadmapRows } = await db.query(
    `SELECT * FROM development_roadmaps 
     WHERE candidate_id = $1 AND goal_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [candidateId, goal.id]
  );

  let roadmap = roadmapRows[0];
  if (!roadmap) {
    // Automatically generate if goal exists but roadmap not yet generated
    return await generateDevelopmentRoadmap(candidateId);
  }

  // Fetch recommendations for this roadmap (excluding superseded recommendations)
  const { rows: recs } = await db.query(
    `SELECT r.*, s.slug as skill_slug, s.name as skill_name, s.category as skill_category,
            a.title as activity_title, a.activity_type, a.difficulty as activity_difficulty,
            a.estimated_minutes, a.assessment_slug, a.verification_requirement, a.activity_metadata
     FROM roadmap_recommendations r
     LEFT JOIN skills s ON r.skill_id = s.id
     LEFT JOIN learning_activities a ON r.activity_id = a.id
     WHERE r.roadmap_id = $1 AND r.status != 'superseded'
     ORDER BY r.priority ASC, r.created_at ASC`,
    [roadmap.id]
  );

  return {
    has_goal: true,
    roadmap_id: roadmap.id,
    candidate_id: candidateId,
    goal,
    engine_version: roadmap.engine_version,
    model_metadata: roadmap.model_metadata || {},
    readiness_score: Number(roadmap.readiness_score),
    summary: roadmap.summary_json,
    gaps: roadmap.gap_analysis_json,
    recommendations: recs,
    generated_at: roadmap.created_at
  };
}

/**
 * Update the status of a specific recommendation item with strict lifecycle validation
 */
export async function updateRecommendationStatus({ candidateId, recommendationId, status, completionMetadata = {} }) {
  const validStatuses = ['active', 'in_progress', 'completed', 'dismissed'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    error.status = 400;
    throw error;
  }

  // Verify candidate ownership of this recommendation
  const { rows: recRows } = await db.query(
    `SELECT r.*, rd.candidate_id as roadmap_candidate_id
     FROM roadmap_recommendations r
     JOIN development_roadmaps rd ON r.roadmap_id = rd.id
     WHERE r.id = $1`,
    [recommendationId]
  );

  if (!recRows[0]) {
    const error = new Error('Recommendation item not found');
    error.status = 404;
    throw error;
  }

  if (recRows[0].candidate_id !== candidateId && recRows[0].roadmap_candidate_id !== candidateId) {
    const error = new Error('Forbidden: You can only update recommendations in your own roadmap');
    error.status = 403;
    throw error;
  }

  const currentStatus = recRows[0].status;

  // Validate allowed state transitions
  const allowedTransitions = {
    active: ['active', 'in_progress', 'completed', 'dismissed'],
    in_progress: ['in_progress', 'active', 'completed', 'dismissed'],
    completed: ['completed', 'in_progress'],
    dismissed: ['dismissed', 'active'],
    superseded: ['superseded']
  };

  const allowed = allowedTransitions[currentStatus] || ['active', 'in_progress', 'completed', 'dismissed'];
  if (!allowed.includes(status)) {
    const error = new Error(`Invalid status transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const completedAt = status === 'completed' 
    ? (recRows[0].completed_at || new Date().toISOString()) 
    : (status === 'active' || status === 'in_progress' ? null : recRows[0].completed_at);

  const { rows: updatedRows } = await db.query(
    `UPDATE roadmap_recommendations
     SET status = $1,
         completed_at = $2,
         completion_metadata = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, completedAt, JSON.stringify(completionMetadata), recommendationId]
  );

  return updatedRows[0];
}

/**
 * Get available learning activities catalogue
 */
export async function getLearningActivitiesCatalogue(skillSlug = null) {
  let query = `
    SELECT a.*, s.slug as skill_slug, s.name as skill_name, s.category as skill_category
    FROM learning_activities a
    JOIN skills s ON a.skill_id = s.id
  `;
  const params = [];

  if (skillSlug) {
    query += ` WHERE s.slug = $1`;
    params.push(skillSlug.toLowerCase().trim());
  }

  query += ` ORDER BY s.category ASC, a.difficulty ASC, a.title ASC`;

  const { rows } = await db.query(query, params);
  return rows;
}
