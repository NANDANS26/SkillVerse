# Backend/app/api/v1/recommend.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
import numpy as np

from app.core.auth import verify_service_token

router = APIRouter()

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        from app.core.embeddings import EmbeddingService
        _embedder = EmbeddingService()
    return _embedder

# Pydantic schemas
class StudentGapContext(BaseModel):
    target_requirement: str
    skill_id: Optional[int] = None
    skill_slug: Optional[str] = None
    skill_name: Optional[str] = None
    gap_state: str = "unassessed"
    confidence_score: float = 0.0
    proficiency_tier: str = "Unassessed"
    verification_status: str = "unverified"
    missing_elements: List[str] = Field(default_factory=list)
    rationale: Optional[str] = ""

class StudentContext(BaseModel):
    candidate_id: int
    target_title: str
    target_skills: List[str] = Field(default_factory=list)
    readiness_score: float = 0.0
    gaps: List[StudentGapContext] = Field(default_factory=list)

class ActivityCandidate(BaseModel):
    id: int
    skill_id: Optional[int] = None
    skill_slug: Optional[str] = None
    skill_name: Optional[str] = None
    activity_type: str = "practice_project"  # 'assessment', 'practice_project', 'code_challenge'
    title: str
    description: str = ""
    difficulty: str = "intermediate"  # 'foundational', 'intermediate', 'advanced'
    estimated_minutes: int = 60
    assessment_slug: Optional[str] = None
    verification_requirement: Optional[str] = None
    activity_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RecommendActivitiesReq(BaseModel):
    student_context: StudentContext
    candidate_activities: List[ActivityCandidate]
    top_k: int = Field(default=5, ge=1, le=50)

def build_activity_doc(activity: ActivityCandidate) -> str:
    title = activity.title or ""
    skill = activity.skill_name or activity.skill_slug or "General Engineering"
    act_type = (activity.activity_type or "activity").replace("_", " ").title()
    diff = (activity.difficulty or "intermediate").title()
    desc = activity.description or ""
    req = activity.verification_requirement or ""
    meta = activity.activity_metadata or {}
    deliverable = meta.get("deliverable", "")
    objectives = meta.get("learning_objectives", "")

    parts = [
        f"Activity: {title}",
        f"Core Skill: {skill}",
        f"Type: {act_type}",
        f"Difficulty: {diff}",
        f"Description: {desc}"
    ]
    if req:
        parts.append(f"Verification: {req}")
    if deliverable:
        parts.append(f"Deliverable: {deliverable}")
    if objectives:
        parts.append(f"Objectives: {objectives}")

    return " | ".join(parts)

def build_student_context_doc(context: StudentContext) -> str:
    title = context.target_title or "Target Career Track"
    skills_str = ", ".join(context.target_skills) if context.target_skills else "Standard Technical Stack"
    parts = [
        f"Target Role: {title}",
        f"Required Target Competencies: {skills_str}",
        f"Baseline Readiness: {context.readiness_score}%"
    ]

    gap_notes = []
    for g in context.gaps:
        name = g.target_requirement or g.skill_name or "Requirement"
        missing_str = ", ".join(g.missing_elements) if g.missing_elements else "Formal empirical evidence"
        gap_notes.append(
            f"{name} (State: {g.gap_state}, Tier: {g.proficiency_tier}, Conf: {int(g.confidence_score * 100)}%, Missing: {missing_str})"
        )

    if gap_notes:
        parts.append("Identified Gaps: " + " ; ".join(gap_notes))

    return " | ".join(parts)

def calculate_gap_urgency(gap: Optional[StudentGapContext]) -> float:
    if not gap:
        return 0.50

    state = (gap.gap_state or "").lower()
    if state == "development_indicated":
        # Candidate has an empirical failure or sub-threshold attempt: highest urgency
        return 1.00
    elif state == "unassessed":
        # Unproven requirement in profile: high urgency
        return 0.85
    elif state == "evidence_rejected":
        # Prior evidence was rejected: needs revision
        return 0.80
    elif state == "unresolved_requirement":
        # Non-canonical requirement needing clarification
        return 0.50
    elif state == "evidence_pending":
        # Awaiting mentor evaluation: lower urgency to assign duplicate task
        return 0.40
    elif state == "evidence_supports_target":
        # Already verified: maintain recency only
        return 0.25
    return 0.50

def calculate_difficulty_calibration(candidate_tier: str, gap_state: str, activity_difficulty: str) -> float:
    tier = (candidate_tier or "").lower()
    state = (gap_state or "").lower()
    diff = (activity_difficulty or "").lower()

    if state == "development_indicated" or tier in ["unassessed", "beginner", "foundational"]:
        if diff == "foundational":
            return 1.00
        elif diff == "intermediate":
            return 0.85
        elif diff == "advanced":
            return 0.50
    elif tier in ["intermediate"]:
        if diff == "intermediate":
            return 1.00
        elif diff == "advanced":
            return 0.85
        elif diff == "foundational":
            return 0.60
    elif tier in ["advanced", "expert"] or state == "evidence_supports_target":
        if diff == "advanced":
            return 1.00
        elif diff == "intermediate":
            return 0.75
        elif diff == "foundational":
            return 0.40

    return 0.70

def calculate_verification_payoff(activity: ActivityCandidate) -> float:
    act_type = (activity.activity_type or "").lower()
    has_benchmark = bool(activity.assessment_slug)
    has_req = bool(activity.verification_requirement)

    if act_type == "assessment" or has_benchmark:
        # Standardized assessment provides instant verified Skill DNA credit upon passing
        return 1.00
    elif act_type == "practice_project" and has_req:
        # Structured project with submission criteria
        return 0.90
    elif act_type == "code_challenge":
        return 0.80
    return 0.60

def generate_grounded_rationale(
    activity: ActivityCandidate,
    gap: Optional[StudentGapContext],
    sim: float,
    gap_score: float,
    calib_score: float,
    payoff_score: float
) -> Dict[str, Any]:
    skill_label = activity.skill_name or activity.skill_slug or "Target Competency"
    gap_state = gap.gap_state if gap else "unassessed"
    sim_pct = int(round(sim * 100))

    reasons = []
    if gap_state == "development_indicated":
        reasons.append(f"Directly addresses demonstrated conceptual gap in {skill_label}")
    elif gap_state == "unassessed":
        reasons.append(f"Satisfies unassessed core requirement for {skill_label}")
    elif gap_state == "evidence_rejected":
        reasons.append(f"Provides structured deliverable to replace rejected {skill_label} submission")
    elif gap_state == "evidence_supports_target":
        reasons.append(f"Deepens verified {skill_label} competency through advanced applied challenge")
    else:
        reasons.append(f"Enhances alignment with {skill_label} target curriculum")

    if activity.activity_type == "assessment":
        reasons.append("Delivers server-graded benchmark verification toward verified Skill DNA profile")
    elif activity.verification_requirement:
        reasons.append(f"Provides verifiable milestone: {activity.verification_requirement}")

    rationale_text = f"{'. '.join(reasons)}. Semantic relevance: {sim_pct}% content alignment with active goal requirements."

    return {
        "primary_driver": reasons[0] if reasons else "Aligned with career goal curriculum",
        "semantic_relevance_pct": sim_pct,
        "gap_state": gap_state,
        "difficulty_calibration": f"{activity.difficulty.title()} tier calibrated to current proficiency",
        "verification_impact": "Direct Skill DNA verification" if activity.activity_type == "assessment" else "Applied repository proof",
        "rationale_text": rationale_text
    }

@router.post("/recommend_activities", dependencies=[Depends(verify_service_token)])
def recommend_activities(req: RecommendActivitiesReq):
    try:
        embedder = get_embedder()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI model initialization failed: {str(e)}")

    if not req.candidate_activities:
        return {
            "success": True,
            "engine_version": "v2.0.0-ai-semantic-recommendation",
            "model_version": "all-MiniLM-L6-v2",
            "recommendations": [],
            "count": 0,
            "message": "No candidate activities provided"
        }

    # 1. Map student gaps by canonical skill_id and slug for O(1) correlation
    gaps_by_skill_id = {}
    gaps_by_skill_slug = {}
    gaps_by_name = {}
    for g in req.student_context.gaps:
        if g.skill_id is not None:
            gaps_by_skill_id[g.skill_id] = g
        if g.skill_slug:
            gaps_by_skill_slug[g.skill_slug.lower()] = g
        if g.skill_name:
            gaps_by_name[g.skill_name.lower()] = g
        if g.target_requirement:
            gaps_by_name[g.target_requirement.lower()] = g

    # 2. Encode student context document
    student_doc = build_student_context_doc(req.student_context)
    student_vec = embedder.embed(student_doc)

    # 3. Score each activity candidate
    W_SIM = 0.40
    W_GAP = 0.30
    W_CALIB = 0.15
    W_PAYOFF = 0.15

    scored_candidates = []
    for act in req.candidate_activities:
        # Correlate with student gap if available
        gap = None
        if act.skill_id is not None and act.skill_id in gaps_by_skill_id:
            gap = gaps_by_skill_id[act.skill_id]
        elif act.skill_slug and act.skill_slug.lower() in gaps_by_skill_slug:
            gap = gaps_by_skill_slug[act.skill_slug.lower()]
        elif act.skill_name and act.skill_name.lower() in gaps_by_name:
            gap = gaps_by_name[act.skill_name.lower()]

        # Activity document & embedding
        act_doc = build_activity_doc(act)
        act_vec = embedder.embed(act_doc)

        # Semantic cosine similarity (embeddings are L2-normalized)
        raw_sim = float(np.dot(student_vec, act_vec))
        sim = float(np.clip(raw_sim, 0.0, 1.0))

        # Heuristic / evidence factors
        gap_score = calculate_gap_urgency(gap)
        calib_score = calculate_difficulty_calibration(
            gap.proficiency_tier if gap else "Unassessed",
            gap.gap_state if gap else "unassessed",
            act.difficulty
        )
        payoff_score = calculate_verification_payoff(act)

        # Multi-factor formula
        ranking_score = float(
            (W_SIM * sim) +
            (W_GAP * gap_score) +
            (W_CALIB * calib_score) +
            (W_PAYOFF * payoff_score)
        )
        ranking_score = float(np.clip(ranking_score, 0.0, 1.0))

        # Grounded explanation
        explanation = generate_grounded_rationale(act, gap, sim, gap_score, calib_score, payoff_score)

        scored_candidates.append({
            "activity_id": act.id,
            "skill_id": act.skill_id,
            "skill_slug": act.skill_slug,
            "skill_name": act.skill_name,
            "title": act.title,
            "activity_type": act.activity_type,
            "difficulty": act.difficulty,
            "estimated_minutes": act.estimated_minutes,
            "assessment_slug": act.assessment_slug,
            "verification_requirement": act.verification_requirement,
            "ranking_score": round(ranking_score, 4),
            "semantic_similarity": round(sim, 4),
            "scoring_breakdown": {
                "semantic_similarity": round(sim, 4),
                "gap_urgency": round(gap_score, 4),
                "difficulty_calibration": round(calib_score, 4),
                "verification_payoff": round(payoff_score, 4),
                "weights": {
                    "semantic_similarity": W_SIM,
                    "gap_urgency": W_GAP,
                    "difficulty_calibration": W_CALIB,
                    "verification_payoff": W_PAYOFF
                }
            },
            "explanation": explanation
        })

    # 4. Rank candidates descending by multi-factor score
    scored_candidates.sort(key=lambda x: x["ranking_score"], reverse=True)

    # 5. Return top_k
    top_recommendations = scored_candidates[:req.top_k]

    return {
        "success": True,
        "engine_version": "v2.0.0-ai-semantic-recommendation",
        "model_version": "all-MiniLM-L6-v2",
        "retrieval_method": "SentenceTransformer-Cosine + MultiFactor-Ranker",
        "total_evaluated": len(scored_candidates),
        "count": len(top_recommendations),
        "recommendations": top_recommendations
    }
