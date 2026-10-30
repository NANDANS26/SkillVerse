// Backend/src/services/analytics.service.js
import { db } from '../config/db.js';
import { getQueueStatus } from './indexing_queue.service.js';
import { getMLIndexStatus } from './ml.service.js';

/**
 * Normalizes a skill string against the canonical skills taxonomy.
 * Returns { id, name, slug, is_canonical: true } or { raw: string, is_canonical: false }
 */
export async function normalizeSkillString(skillStr, allCanonicalSkills) {
  if (!skillStr || typeof skillStr !== 'string') return null;
  const clean = skillStr.trim().toLowerCase();
  if (!clean) return null;

  for (const s of allCanonicalSkills) {
    if (s.name.toLowerCase() === clean || s.slug.toLowerCase() === clean) {
      return { id: s.id, name: s.name, slug: s.slug, is_canonical: true };
    }
    const aliases = Array.isArray(s.aliases)
      ? s.aliases
      : typeof s.aliases === 'string'
      ? JSON.parse(s.aliases || '[]')
      : [];
    if (aliases.some(a => String(a).toLowerCase().trim() === clean)) {
      return { id: s.id, name: s.name, slug: s.slug, is_canonical: true };
    }
  }

  return { raw: skillStr.trim(), is_canonical: false };
}

/**
 * 1. STUDENT ANALYTICS
 * Derives explainable skill intelligence for the authenticated student.
 */
export async function getStudentAnalytics(userId) {
  // Resolve candidate ID
  const { rows: candRows } = await db.query(
    'SELECT id, full_name, headline, experience_years, skill_json FROM candidates WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (!candRows[0]) {
    return {
      has_profile: false,
      message: 'Candidate profile has not been created yet'
    };
  }
  const candidate = candRows[0];
  const candidateId = candidate.id;

  // A. Assessment attempts over time
  const { rows: attemptRows } = await db.query(
    `SELECT aa.id, a.slug, a.title, s.name as skill_name,
            aa.score, aa.passed, aa.duration_seconds, aa.completed_at
     FROM assessment_attempts aa
     JOIN assessments a ON aa.assessment_id = a.id
     JOIN skills s ON a.skill_id = s.id
     WHERE aa.candidate_id = $1
     ORDER BY aa.completed_at ASC`,
    [candidateId]
  );

  const totalAttempts = attemptRows.length;
  const passedAttempts = attemptRows.filter(a => a.passed).length;
  const failedAttempts = totalAttempts - passedAttempts;

  // B. Canonical skills with assessed evidence (passed assessment)
  const { rows: assessedSkillsRows } = await db.query(
    `SELECT DISTINCT s.id, s.name, s.slug, MAX(aa.score) as highest_score
     FROM assessment_attempts aa
     JOIN assessments a ON aa.assessment_id = a.id
     JOIN skills s ON a.skill_id = s.id
     WHERE aa.candidate_id = $1 AND aa.passed = true
     GROUP BY s.id, s.name, s.slug
     ORDER BY s.name ASC`,
    [candidateId]
  );

  // C. Canonical skills with faculty-reviewed evidence (status = 'verified')
  const { rows: facultyReviewedRows } = await db.query(
    `SELECT DISTINCT s.id, s.name, s.slug, se.title as evidence_title, se.reviewed_at
     FROM skill_evidence se
     JOIN skills s ON se.skill_id = s.id
     WHERE se.candidate_id = $1
       AND se.source_type IN ('faculty_review', 'project_submission')
       AND se.review_status = 'verified'
     ORDER BY s.name ASC`,
    [candidateId]
  );

  // D. Pending or rejected evidence items
  const { rows: pendingEvidenceRows } = await db.query(
    `SELECT se.id, s.name as skill_name, se.source_type, se.title, se.review_status, se.created_at, se.review_feedback
     FROM skill_evidence se
     JOIN skills s ON se.skill_id = s.id
     WHERE se.candidate_id = $1 AND se.review_status IN ('pending', 'unreviewed')
     ORDER BY se.created_at DESC`,
    [candidateId]
  );

  const { rows: rejectedEvidenceRows } = await db.query(
    `SELECT se.id, s.name as skill_name, se.source_type, se.title, se.review_status, se.reviewed_at, se.review_feedback
     FROM skill_evidence se
     JOIN skills s ON se.skill_id = s.id
     WHERE se.candidate_id = $1 AND se.review_status = 'rejected'
     ORDER BY se.reviewed_at DESC`,
    [candidateId]
  );

  // E. Roadmap recommendations lifecycle counts
  const { rows: recStatusRows } = await db.query(
    `SELECT status, COUNT(*)::int as count
     FROM roadmap_recommendations
     WHERE candidate_id = $1 AND status != 'superseded'
     GROUP BY status`,
    [candidateId]
  );

  const recStatusCounts = { active: 0, in_progress: 0, completed: 0, dismissed: 0 };
  for (const r of recStatusRows) {
    if (recStatusCounts[r.status] !== undefined) {
      recStatusCounts[r.status] = r.count;
    }
  }

  // F. Completed development activities
  const { rows: completedActivitiesRows } = await db.query(
    `SELECT rr.id, rr.title, rr.recommendation_type, s.name as skill_name, rr.completed_at
     FROM roadmap_recommendations rr
     LEFT JOIN skills s ON rr.skill_id = s.id
     WHERE rr.candidate_id = $1 AND rr.status = 'completed'
     ORDER BY rr.completed_at DESC NULLS LAST`,
    [candidateId]
  );

  // G. Historical roadmap evaluations (tracking readiness score changes)
  const { rows: roadmapHistoryRows } = await db.query(
    `SELECT dr.id, dr.goal_id, sg.target_title, dr.readiness_score, dr.engine_version,
            dr.created_at, dr.updated_at
     FROM development_roadmaps dr
     JOIN student_goals sg ON dr.goal_id = sg.id
     WHERE dr.candidate_id = $1
     ORDER BY dr.created_at ASC`,
    [candidateId]
  );

  // Insufficient evidence indicator
  const isInsufficientEvidence = totalAttempts === 0 && facultyReviewedRows.length === 0;

  return {
    candidate_id: candidateId,
    candidate_name: candidate.full_name,
    timestamp: new Date().toISOString(),
    is_insufficient_evidence: isInsufficientEvidence,
    disclaimer: 'Readiness score is an auditable heuristic coverage indicator, not an employment probability. Completed development activities do not automatically equal verified proficiency.',
    assessments: {
      total_attempts: totalAttempts,
      passed_attempts: passedAttempts,
      failed_attempts: failedAttempts,
      history: attemptRows
    },
    verified_competencies: {
      assessed_skills_count: assessedSkillsRows.length,
      assessed_skills: assessedSkillsRows,
      faculty_reviewed_skills_count: facultyReviewedRows.length,
      faculty_reviewed_skills: facultyReviewedRows
    },
    evidence_backlog: {
      pending_count: pendingEvidenceRows.length,
      pending_items: pendingEvidenceRows,
      rejected_count: rejectedEvidenceRows.length,
      rejected_items: rejectedEvidenceRows
    },
    roadmap: {
      recommendations_by_status: recStatusCounts,
      completed_activities_count: completedActivitiesRows.length,
      completed_activities: completedActivitiesRows,
      evaluations_history: roadmapHistoryRows
    }
  };
}

/**
 * 2. COLLEGE ADMINISTRATOR ANALYTICS
 * Authorized, institution-scoped aggregation.
 */
export async function getCollegeAdminAnalytics(user) {
  let institutionId = null;
  if (user.role === 'super_admin') {
    const { rows } = await db.query('SELECT id, name, code FROM institutions ORDER BY id ASC LIMIT 1');
    institutionId = rows[0]?.id || null;
  } else {
    const { rows } = await db.query(
      'SELECT institution_id FROM institution_memberships WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    institutionId = rows[0]?.institution_id || null;
  }

  if (!institutionId) {
    return {
      has_institution: false,
      message: 'User is not assigned to an active institution',
      total_students: 0,
      total_faculty: 0
    };
  }

  const { rows: instRows } = await db.query('SELECT id, name, code, domain FROM institutions WHERE id = $1', [institutionId]);
  const institution = instRows[0];

  // A. Student and faculty counts
  const { rows: studentCountRow } = await db.query(
    "SELECT COUNT(*)::int as count FROM institution_memberships WHERE institution_id = $1 AND role = 'student'",
    [institutionId]
  );
  const { rows: facultyCountRow } = await db.query(
    "SELECT COUNT(*)::int as count FROM institution_memberships WHERE institution_id = $1 AND role = 'faculty'",
    [institutionId]
  );

  const totalStudents = studentCountRow[0]?.count || 0;
  const totalFaculty = facultyCountRow[0]?.count || 0;

  // B. Faculty Mentorship Assignment Coverage
  const { rows: assignedStudentsRow } = await db.query(
    "SELECT COUNT(DISTINCT student_id)::int as count FROM faculty_student_assignments WHERE institution_id = $1 AND status = 'active'",
    [institutionId]
  );
  const assignedStudents = assignedStudentsRow[0]?.count || 0;
  const unassignedStudents = Math.max(0, totalStudents - assignedStudents);
  const assignmentCoveragePct = totalStudents > 0 ? Number(((assignedStudents / totalStudents) * 100).toFixed(1)) : 0.0;

  // C. Evidence Review Backlog
  const { rows: backlogRow } = await db.query(
    `SELECT COUNT(*)::int as count
     FROM skill_evidence se
     JOIN candidates c ON se.candidate_id = c.id
     JOIN institution_memberships im ON c.user_id = im.user_id
     WHERE im.institution_id = $1 AND se.review_status IN ('pending', 'unreviewed')`,
    [institutionId]
  );
  const reviewBacklogCount = backlogRow[0]?.count || 0;

  // D. Assessment Participation & Score Distribution across institution's students
  const { rows: asmStatsRow } = await db.query(
    `SELECT COUNT(*)::int as total_attempts,
            COUNT(CASE WHEN aa.passed THEN 1 END)::int as passed_attempts,
            COUNT(CASE WHEN NOT aa.passed THEN 1 END)::int as failed_attempts,
            ROUND(AVG(aa.score * 100)::numeric, 1) as avg_score
     FROM assessment_attempts aa
     JOIN candidates c ON aa.candidate_id = c.id
     JOIN institution_memberships im ON c.user_id = im.user_id
     WHERE im.institution_id = $1`,
    [institutionId]
  );
  const asmStats = asmStatsRow[0] || { total_attempts: 0, passed_attempts: 0, failed_attempts: 0, avg_score: 0.0 };

  // E. Students by Canonical Skill and Evidence State
  const { rows: skillDistributionRows } = await db.query(
    `SELECT s.id, s.name, s.slug, s.category,
            COUNT(DISTINCT CASE WHEN aa.passed = true THEN c.id END)::int as assessed_students,
            COUNT(DISTINCT CASE WHEN se.source_type IN ('faculty_review', 'project_submission') AND se.review_status = 'verified' THEN c.id END)::int as faculty_verified_students,
            COUNT(DISTINCT CASE WHEN se.review_status IN ('pending', 'unreviewed') THEN c.id END)::int as pending_review_students
     FROM skills s
     CROSS JOIN (
       SELECT c.id, c.user_id
       FROM institution_memberships im
       JOIN candidates c ON im.user_id = c.user_id
       WHERE im.institution_id = $1
     ) c
     LEFT JOIN assessment_attempts aa ON aa.candidate_id = c.id AND aa.assessment_id IN (SELECT id FROM assessments WHERE skill_id = s.id)
     LEFT JOIN skill_evidence se ON se.candidate_id = c.id AND se.skill_id = s.id
     GROUP BY s.id, s.name, s.slug, s.category
     HAVING COUNT(DISTINCT CASE WHEN aa.passed = true THEN c.id END) > 0
         OR COUNT(DISTINCT CASE WHEN se.source_type IN ('faculty_review', 'project_submission') AND se.review_status = 'verified' THEN c.id END) > 0
         OR COUNT(DISTINCT CASE WHEN se.review_status IN ('pending', 'unreviewed') THEN c.id END) > 0
     ORDER BY s.name ASC`,
    [institutionId]
  );

  // F. Roadmap Activity States across enrolled candidates
  const { rows: roadmapStateRows } = await db.query(
    `SELECT rr.status, COUNT(*)::int as count
     FROM roadmap_recommendations rr
     JOIN candidates c ON rr.candidate_id = c.id
     JOIN institution_memberships im ON c.user_id = im.user_id
     WHERE im.institution_id = $1 AND rr.status != 'superseded'
     GROUP BY rr.status`,
    [institutionId]
  );
  const roadmapLifecycleCounts = { active: 0, in_progress: 0, completed: 0, dismissed: 0 };
  for (const r of roadmapStateRows) {
    if (roadmapLifecycleCounts[r.status] !== undefined) {
      roadmapLifecycleCounts[r.status] = r.count;
    }
  }

  return {
    institution: {
      id: institution.id,
      name: institution.name,
      code: institution.code,
      domain: institution.domain
    },
    timestamp: new Date().toISOString(),
    cohort: {
      total_students: totalStudents,
      total_faculty: totalFaculty,
      assigned_students: assignedStudents,
      unassigned_students: unassignedStudents,
      assignment_coverage_pct: assignmentCoveragePct
    },
    evidence_pipeline: {
      review_backlog_count: reviewBacklogCount,
      skills_breakdown: skillDistributionRows
    },
    assessments: {
      total_attempts: asmStats.total_attempts,
      passed_attempts: asmStats.passed_attempts,
      failed_attempts: asmStats.failed_attempts,
      average_score: Number(asmStats.avg_score || 0)
    },
    development_activities: {
      lifecycle_counts: roadmapLifecycleCounts
    }
  };
}

/**
 * 3. FACULTY ANALYTICS
 * Authorized mentorship and evidence review overview for the authenticated faculty member.
 */
export async function getFacultyAnalytics(user) {
  const facultyId = user.id;

  // A. Assigned Mentees
  const { rows: menteeRows } = await db.query(
    `SELECT u.id as user_id, u.name, u.email,
            c.id as candidate_id, c.headline, c.experience_years, c.skill_json,
            fsa.assigned_at, fsa.notes
     FROM faculty_student_assignments fsa
     JOIN users u ON fsa.student_id = u.id
     LEFT JOIN candidates c ON c.user_id = u.id
     WHERE fsa.faculty_id = $1 AND fsa.status = 'active'
     ORDER BY u.name ASC`,
    [facultyId]
  );

  const menteeCandidateIds = menteeRows.map(m => m.candidate_id).filter(Boolean);

  // B. Pending Evidence Submissions awaiting review for assigned mentees
  let pendingReviews = [];
  if (menteeCandidateIds.length > 0) {
    const { rows: pendRows } = await db.query(
      `SELECT se.id, se.candidate_id, c.full_name as student_name, s.name as skill_name,
              se.source_type, se.title, se.source_reference, se.created_at
       FROM skill_evidence se
       JOIN candidates c ON se.candidate_id = c.id
       JOIN skills s ON se.skill_id = s.id
       WHERE se.candidate_id = ANY($1::int[]) AND se.review_status IN ('pending', 'unreviewed')
       ORDER BY se.created_at ASC`,
      [menteeCandidateIds]
    );
    pendingReviews = pendRows;
  }

  // C. Review decisions and outcomes made by this faculty member
  const { rows: decisionRows } = await db.query(
    `SELECT review_status, COUNT(*)::int as count
     FROM skill_evidence
     WHERE reviewer_id = $1
     GROUP BY review_status`,
    [facultyId]
  );
  const decisionStats = { approved: 0, rejected: 0, total_reviewed: 0 };
  for (const d of decisionRows) {
    if (d.review_status === 'verified') decisionStats.approved = d.count;
    if (d.review_status === 'rejected') decisionStats.rejected = d.count;
  }
  decisionStats.total_reviewed = decisionStats.approved + decisionStats.rejected;

  // D. Mentee Assessment & Evidence Coverage
  let menteeEvidenceSummary = { total_assessments_passed: 0, verified_skills_count: 0 };
  if (menteeCandidateIds.length > 0) {
    const { rows: passRows } = await db.query(
      `SELECT COUNT(*)::int as count FROM assessment_attempts WHERE candidate_id = ANY($1::int[]) AND passed = true`,
      [menteeCandidateIds]
    );
    const { rows: verRows } = await db.query(
      `SELECT COUNT(DISTINCT skill_id)::int as count FROM skill_evidence WHERE candidate_id = ANY($1::int[]) AND review_status = 'verified'`,
      [menteeCandidateIds]
    );
    menteeEvidenceSummary.total_assessments_passed = passRows[0]?.count || 0;
    menteeEvidenceSummary.verified_skills_count = verRows[0]?.count || 0;
  }

  return {
    faculty_user_id: facultyId,
    timestamp: new Date().toISOString(),
    mentees: {
      total_count: menteeRows.length,
      roster: menteeRows
    },
    reviews: {
      pending_backlog_count: pendingReviews.length,
      pending_items: pendingReviews,
      decisions_completed: decisionStats
    },
    coverage: menteeEvidenceSummary
  };
}

/**
 * 4. WORKFORCE DEMAND & CANDIDATE SUPPLY INTELLIGENCE
 * Aggregates skill demand from open job requisitions against observable candidate evidence.
 */
export async function getWorkforceDemandAnalytics(user, filters = {}) {
  // 1. Fetch canonical taxonomy
  const { rows: canonicalSkills } = await db.query('SELECT id, slug, name, category, aliases FROM skills ORDER BY name ASC');

  // 2. Fetch open job requisitions (strictly enforcing tenant boundaries)
  let jobQuery = "SELECT id, title, company_id, location, parsed_json, experience_min, experience_max, status, created_at FROM jobs WHERE status IN ('open', 'active')";
  const jobParams = [];

  if (user.role === 'recruiter' || user.role === 'company_admin') {
    // Recruiters and Company Admins MUST be restricted to their own corporate tenant
    const { rows: compRow } = await db.query('SELECT company_id FROM company_memberships WHERE user_id = $1 LIMIT 1', [user.id]);
    if (compRow[0]?.company_id) {
      jobParams.push(compRow[0].company_id);
      jobQuery += ` AND company_id = $${jobParams.length}`;
    } else {
      // User is not affiliated with any authorized company; return zero jobs
      jobQuery += ' AND 1 = 0';
    }
  } else if (filters.company_id && user.role === 'super_admin') {
    // Only super_admin can filter by an arbitrary company_id
    jobParams.push(filters.company_id);
    jobQuery += ` AND company_id = $${jobParams.length}`;
  }

  const { rows: openJobs } = await db.query(jobQuery, jobParams);
  const totalOpenJobs = openJobs.length;

  // 3. Map open job requirements to canonical skills (and track unresolved)
  // Each open job counts ONCE per canonical skill
  const canonicalDemand = new Map(); // skill_id -> { skill, count, distinct_jobs: Set }
  const unresolvedRequirements = new Map(); // raw_string -> { count, distinct_jobs: Set }

  for (const s of canonicalSkills) {
    canonicalDemand.set(s.id, {
      skill_id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      distinct_jobs_requiring: 0,
      job_ids: new Set()
    });
  }

  for (const job of openJobs) {
    let reqSkills = [];
    if (job.parsed_json && typeof job.parsed_json === 'object') {
      reqSkills = Array.isArray(job.parsed_json.skills)
        ? job.parsed_json.skills
        : Array.isArray(job.parsed_json.required_skills)
        ? job.parsed_json.required_skills
        : [];
    }
    const seenSkillIdsForJob = new Set();

    for (const rawSkill of reqSkills) {
      if (!rawSkill || typeof rawSkill !== 'string') continue;
      const normalized = await normalizeSkillString(rawSkill, canonicalSkills);
      if (normalized && normalized.is_canonical) {
        if (!seenSkillIdsForJob.has(normalized.id)) {
          seenSkillIdsForJob.add(normalized.id);
          const entry = canonicalDemand.get(normalized.id);
          if (entry) {
            entry.job_ids.add(job.id);
          }
        }
      } else if (normalized && !normalized.is_canonical) {
        const key = normalized.raw.toLowerCase();
        if (!unresolvedRequirements.has(key)) {
          unresolvedRequirements.set(key, { raw_name: normalized.raw, job_ids: new Set() });
        }
        unresolvedRequirements.get(key).job_ids.add(job.id);
      }
    }
  }

  // 4. Candidate Evidence Supply
  // Aggregate candidate counts across evidence tiers:
  // - assessed (passed benchmark assessment)
  // - faculty_reviewed (status = 'verified')
  // - self_reported_only (only profile skill_json without empirical proof)
  const { rows: assessedCandidatesBySkill } = await db.query(
    `SELECT a.skill_id, COUNT(DISTINCT aa.candidate_id)::int as count
     FROM assessment_attempts aa
     JOIN assessments a ON aa.assessment_id = a.id
     WHERE aa.passed = true
     GROUP BY a.skill_id`
  );
  const assessedSupplyMap = new Map();
  for (const r of assessedCandidatesBySkill) assessedSupplyMap.set(r.skill_id, r.count);

  const { rows: facultyReviewedBySkill } = await db.query(
    `SELECT skill_id, COUNT(DISTINCT candidate_id)::int as count
     FROM skill_evidence
     WHERE source_type IN ('faculty_review', 'project_submission') AND review_status = 'verified'
     GROUP BY skill_id`
  );
  const facultySupplyMap = new Map();
  for (const r of facultyReviewedBySkill) facultySupplyMap.set(r.skill_id, r.count);

  // Overall candidate totals
  const { rows: totalCandRow } = await db.query('SELECT COUNT(*)::int as count FROM candidates');
  const totalCandidatesPool = totalCandRow[0]?.count || 0;

  // Build demand vs supply comparative array
  const skillIntelligence = [];
  for (const [skillId, demand] of canonicalDemand.entries()) {
    const jobCount = demand.job_ids.size;
    const assessedCount = assessedSupplyMap.get(skillId) || 0;
    const facultyCount = facultySupplyMap.get(skillId) || 0;
    const verifiedSupply = Math.max(assessedCount, facultyCount); // distinct verified proxy

    const demandPct = totalOpenJobs > 0 ? Number(((jobCount / totalOpenJobs) * 100).toFixed(1)) : 0.0;
    
    let demandToSupplyRatio = null;
    let ratioClassification = 'No Open Requisitions';
    if (verifiedSupply > 0) {
      demandToSupplyRatio = Number((jobCount / verifiedSupply).toFixed(2));
      ratioClassification = demandToSupplyRatio > 1.0 ? 'Talent Deficit' : (demandToSupplyRatio >= 0.8 ? 'Balanced' : 'Adequate Supply');
    } else if (jobCount > 0) {
      demandToSupplyRatio = null; // Undefined denominator (0 verified candidates in observable pool)
      ratioClassification = 'Zero Verified Supply';
    } else {
      demandToSupplyRatio = 0.0;
      ratioClassification = 'No Open Requisitions';
    }

    skillIntelligence.push({
      skill_id: skillId,
      name: demand.name,
      slug: demand.slug,
      category: demand.category,
      distinct_open_jobs_requiring: jobCount,
      percentage_of_open_jobs: demandPct,
      candidate_supply: {
        assessed_evidence_count: assessedCount,
        faculty_reviewed_evidence_count: facultyCount,
        demonstrated_evidence_total: verifiedSupply
      },
      demand_vs_supply_ratio: demandToSupplyRatio,
      ratio_classification: ratioClassification
    });
  }

  // Sort by demand descending
  skillIntelligence.sort((a, b) => b.distinct_open_jobs_requiring - a.distinct_open_jobs_requiring);

  // Unresolved list
  const unresolvedList = [];
  for (const [_, item] of unresolvedRequirements.entries()) {
    unresolvedList.push({
      raw_name: item.raw_name,
      distinct_open_jobs_requiring: item.job_ids.size
    });
  }
  unresolvedList.sort((a, b) => b.distinct_open_jobs_requiring - a.distinct_open_jobs_requiring);

  return {
    timestamp: new Date().toISOString(),
    population_scope: {
      total_open_jobs_analyzed: totalOpenJobs,
      total_candidates_pool: totalCandidatesPool,
      scope_type: filters.company_id ? 'company_scoped' : 'platform_scoped'
    },
    disclaimer: 'Workforce demand and supply intelligence compares recorded open requisitions on SkillVerse with observable evidence in the candidate database. This metric is an internal telemetry sample and does not constitute national labour market forecasts or hiring predictions.',
    skill_intelligence: skillIntelligence,
    unresolved_requirements: unresolvedList
  };
}

/**
 * 5. COMPANY ADMINISTRATOR ANALYTICS
 * Organization-scoped aggregation for enterprise administration.
 */
export async function getCompanyAdminAnalytics(user) {
  let companyId = null;
  if (user.role === 'super_admin') {
    const { rows } = await db.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
    companyId = rows[0]?.id || null;
  } else {
    const { rows } = await db.query(
      'SELECT company_id FROM company_memberships WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    companyId = rows[0]?.company_id || null;
  }

  if (!companyId) {
    return {
      has_company: false,
      message: 'User is not assigned to an enterprise company organization',
      total_requisitions: 0,
      open_requisitions: 0
    };
  }

  const { rows: compRows } = await db.query('SELECT id, name, domain, industry FROM companies WHERE id = $1', [companyId]);
  const company = compRows[0];

  // A. Recruiters associated with company
  const { rows: recruiterRows } = await db.query(
    `SELECT u.id as user_id, u.name, u.email, cm.role as company_role, cm.created_at as joined_at
     FROM company_memberships cm
     JOIN users u ON cm.user_id = u.id
     WHERE cm.company_id = $1
     ORDER BY u.name ASC`,
    [companyId]
  );

  // B. Requisitions counts
  const { rows: jobCountsRow } = await db.query(
    `SELECT COUNT(*)::int as total_jobs,
            COUNT(CASE WHEN status IN ('open', 'active') THEN 1 END)::int as open_jobs,
            COUNT(CASE WHEN status = 'closed' THEN 1 END)::int as closed_jobs,
            COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as draft_jobs
     FROM jobs
     WHERE company_id = $1`,
    [companyId]
  );
  const jobCounts = jobCountsRow[0] || { total_jobs: 0, open_jobs: 0, closed_jobs: 0, draft_jobs: 0 };

  // C. Application pipeline status counts
  const { rows: appStatusRows } = await db.query(
    `SELECT a.status, COUNT(*)::int as count
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE j.company_id = $1
     GROUP BY a.status`,
    [companyId]
  );
  const pipelineCounts = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewing: 0,
    offered: 0,
    hired: 0,
    rejected: 0
  };
  let totalApplications = 0;
  for (const r of appStatusRows) {
    if (pipelineCounts[r.status] !== undefined) {
      pipelineCounts[r.status] = r.count;
    }
    totalApplications += r.count;
  }

  return {
    company: {
      id: company.id,
      name: company.name,
      domain: company.domain,
      industry: company.industry
    },
    timestamp: new Date().toISOString(),
    recruiters: {
      total_count: recruiterRows.length,
      roster: recruiterRows
    },
    requisitions: {
      total: jobCounts.total_jobs,
      open: jobCounts.open_jobs,
      closed: jobCounts.closed_jobs,
      draft: jobCounts.draft_jobs
    },
    pipeline: {
      total_applications: totalApplications,
      by_status: pipelineCounts
    },
    disclaimer: 'Pipeline outcomes are strictly based on persisted application records. Hires are only recorded when application status is explicitly "hired".'
  };
}

/**
 * 6. SUPER ADMINISTRATOR OPERATIONAL ANALYTICS
 * Authoritative overview of infrastructure, security, lifecycle telemetry, and audit health.
 */
export async function getOperationalAnalytics() {
  // A. User counts by canonical role
  const { rows: roleRows } = await db.query(
    'SELECT role, COUNT(*)::int as count FROM users GROUP BY role ORDER BY role ASC'
  );
  const usersByRole = {
    student: 0,
    college_admin: 0,
    faculty: 0,
    company_admin: 0,
    recruiter: 0,
    super_admin: 0
  };
  let totalUsers = 0;
  for (const r of roleRows) {
    usersByRole[r.role] = r.count;
    totalUsers += r.count;
  }

  // B. Organization counts
  const { rows: instCountRow } = await db.query('SELECT COUNT(*)::int as count FROM institutions');
  const { rows: compCountRow } = await db.query('SELECT COUNT(*)::int as count FROM companies');

  // C. Assessments & Evidence counts
  const { rows: asmCountsRow } = await db.query(
    `SELECT COUNT(*)::int as total_attempts,
            COUNT(CASE WHEN passed THEN 1 END)::int as passed_attempts
     FROM assessment_attempts`
  );
  const { rows: evCountsRow } = await db.query(
    `SELECT review_status, COUNT(*)::int as count
     FROM skill_evidence
     GROUP BY review_status`
  );
  const evidenceByStatus = { verified: 0, pending: 0, unreviewed: 0, rejected: 0 };
  for (const r of evCountsRow) {
    if (evidenceByStatus[r.review_status] !== undefined) {
      evidenceByStatus[r.review_status] = r.count;
    }
  }

  // D. Roadmap and Recommendation lifecycle counts
  const { rows: roadmapCountRow } = await db.query('SELECT COUNT(*)::int as count FROM development_roadmaps');
  const { rows: recLifecycleRows } = await db.query(
    `SELECT status, COUNT(*)::int as count
     FROM roadmap_recommendations
     GROUP BY status`
  );
  const recommendationsByStatus = { active: 0, in_progress: 0, completed: 0, dismissed: 0, superseded: 0 };
  for (const r of recLifecycleRows) {
    if (recommendationsByStatus[r.status] !== undefined) {
      recommendationsByStatus[r.status] = r.count;
    }
  }

  // E. Candidate Indexing Queue Telemetry
  const queueMetrics = await getQueueStatus();

  // F. ML Vector Index Status
  let mlStatus = null;
  try {
    mlStatus = await getMLIndexStatus();
  } catch (err) {
    mlStatus = { status: 'unavailable', error: err.message };
  }

  // G. Recent Audit Events (sanitized: only action, entity_type, entity_id, timestamp)
  const { rows: auditRows } = await db.query(
    `SELECT id, user_id, action, entity_type, entity_id, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 20`
  );

  // H. Failed Operations Requiring Intervention
  const { rows: failedQueueRows } = await db.query(
    `SELECT id, candidate_id, attempts, last_error, created_at, updated_at
     FROM indexing_queue
     WHERE status = 'failed'
     ORDER BY updated_at DESC
     LIMIT 10`
  );

  return {
    platform: 'SkillVerse AI Intelligence Platform',
    timestamp: new Date().toISOString(),
    operational_status: 'healthy',
    users: {
      total: totalUsers,
      by_role: usersByRole
    },
    organizations: {
      institutions: instCountRow[0]?.count || 0,
      companies: compCountRow[0]?.count || 0
    },
    competencies_and_assessments: {
      assessment_attempts_total: asmCountsRow[0]?.total_attempts || 0,
      assessment_attempts_passed: asmCountsRow[0]?.passed_attempts || 0,
      evidence_by_status: evidenceByStatus
    },
    roadmaps_and_recommendations: {
      roadmaps_total: roadmapCountRow[0]?.count || 0,
      recommendations_by_status: recommendationsByStatus
    },
    indexing_queue: queueMetrics,
    ml_service: mlStatus,
    recent_audit_events: auditRows,
    failed_operations: {
      count: failedQueueRows.length,
      items: failedQueueRows
    },
    disclaimer: 'Operational telemetry reflects live infrastructure and queue metrics. Platform health is not an indicator of commercial placement success.'
  };
}
