# Backend/tests/evaluate_recommendations.py
"""
Offline Evaluation Suite for SkillVerse AI Learning Recommendation Engine
Compares Model-Assisted Multi-Factor Ranking against Deterministic Priority Baseline.
Computes Precision@K, Recall@K, NDCG@K, and Skill-Gap Coverage.
"""

import math
import json
import numpy as np
from typing import List, Dict, Any

from app.core.embeddings import EmbeddingService
from app.api.v1.recommend import (
    build_activity_doc,
    build_student_context_doc,
    calculate_gap_urgency,
    calculate_difficulty_calibration,
    calculate_verification_payoff,
    generate_grounded_rationale,
    ActivityCandidate,
    StudentContext,
    StudentGapContext
)

# 1. Activity Catalogue Seed Data (Canonical Skills & Activities)
CATALOGUE: List[ActivityCandidate] = [
    ActivityCandidate(
        id=1, skill_id=1, skill_slug="rust", skill_name="Rust",
        activity_type="assessment", title="Rust Systems Engineering Technical Benchmark",
        description="Evaluate Rust ownership semantics, borrow checker rules, RAII memory safety, and concurrency.",
        difficulty="intermediate", estimated_minutes=15, assessment_slug="rust-systems-foundations",
        verification_requirement="Complete server-graded benchmark assessment with score >= 60%"
    ),
    ActivityCandidate(
        id=2, skill_id=1, skill_slug="rust", skill_name="Rust",
        activity_type="practice_project", title="Zero-Copy Lock-Free Ring Buffer in Rust",
        description="Implement a thread-safe, lock-free ring buffer for asynchronous packet streaming.",
        difficulty="advanced", estimated_minutes=120,
        verification_requirement="Submit public GitHub repository with comprehensive unit tests"
    ),
    ActivityCandidate(
        id=3, skill_id=2, skill_slug="distributed-systems", skill_name="Distributed Systems",
        activity_type="assessment", title="Distributed Consensus & Fault Tolerance Technical Benchmark",
        description="Test competencies in Paxos, Raft leader election, CAP theorem trade-offs, and partition recovery.",
        difficulty="intermediate", estimated_minutes=15, assessment_slug="distributed-systems-consensus",
        verification_requirement="Complete server-graded benchmark assessment with score >= 60%"
    ),
    ActivityCandidate(
        id=4, skill_id=2, skill_slug="distributed-systems", skill_name="Distributed Systems",
        activity_type="practice_project", title="Raft Consensus State Machine Implementation",
        description="Build a 3-node cluster handling state replication, log compaction, snapshotting, and election jitter.",
        difficulty="advanced", estimated_minutes=180,
        verification_requirement="Submit project proof and request assigned faculty mentor review"
    ),
    ActivityCandidate(
        id=5, skill_id=3, skill_slug="python", skill_name="Python",
        activity_type="assessment", title="Python Backend & Async Architecture Technical Benchmark",
        description="Benchmark mastery of asyncio event loops, GIL implications, generators, and coroutine dispatching.",
        difficulty="intermediate", estimated_minutes=15, assessment_slug="python-backend-concurrency",
        verification_requirement="Complete server-graded benchmark assessment with score >= 60%"
    ),
    ActivityCandidate(
        id=6, skill_id=3, skill_slug="python", skill_name="Python",
        activity_type="practice_project", title="Async Event-Driven Streaming Pipeline in Python",
        description="Design an asynchronous stream consumer with backpressure handling, dead-letter queuing, and logging.",
        difficulty="intermediate", estimated_minutes=90,
        verification_requirement="Submit GitHub repository with pytest integration tests and performance benchmarks"
    ),
    ActivityCandidate(
        id=7, skill_id=4, skill_slug="fastapi", skill_name="FastAPI",
        activity_type="practice_project", title="Production-Grade FastAPI Microservice with Dependency Injection",
        description="Construct a resilient REST API featuring Pydantic V2 request models, JWT token verification, and DB pooling.",
        difficulty="intermediate", estimated_minutes=90,
        verification_requirement="Submit repository evidence with automated test runner passing in CI"
    ),
    ActivityCandidate(
        id=8, skill_id=5, skill_slug="postgresql", skill_name="PostgreSQL",
        activity_type="practice_project", title="Transactional Outbox Pattern & Query Optimization in PostgreSQL",
        description="Implement guaranteed at-least-once message delivery using a PostgreSQL outbox table and index optimization.",
        difficulty="advanced", estimated_minutes=120,
        verification_requirement="Submit repository with SQL migration scripts and transaction rollback tests"
    ),
    ActivityCandidate(
        id=9, skill_id=6, skill_slug="react", skill_name="React",
        activity_type="practice_project", title="Accessible Design System & State Architecture in React",
        description="Develop an enterprise component library with keyboard accessibility (WCAG AA) and optimistic UI updates.",
        difficulty="intermediate", estimated_minutes=90,
        verification_requirement="Submit component library repo with Storybook or Vitest component test evidence"
    ),
    ActivityCandidate(
        id=10, skill_id=7, skill_slug="docker", skill_name="Docker",
        activity_type="code_challenge", title="Multi-Stage Distroless Container Hardening",
        description="Containerize a multi-service web backend using non-root execution, multi-stage caching, and vulnerability scanning.",
        difficulty="foundational", estimated_minutes=60,
        verification_requirement="Submit Dockerfile with CI vulnerability scan report demonstrating 0 critical vulnerabilities"
    ),
    ActivityCandidate(
        id=11, skill_id=8, skill_slug="kubernetes", skill_name="Kubernetes",
        activity_type="practice_project", title="Zero-Downtime Deployment with Probes & Resource Limits",
        description="Author production Kubernetes manifests configuring rolling updates, horizontal pod autoscalers, and probes.",
        difficulty="advanced", estimated_minutes=90,
        verification_requirement="Submit Kubernetes YAML manifests with helm or kustomize structure"
    ),
    ActivityCandidate(
        id=12, skill_id=9, skill_slug="go", skill_name="Go",
        activity_type="practice_project", title="Concurrent Worker Pool with Context Cancellation in Go",
        description="Implement a bounded goroutine worker pool with graceful shutdown, rate limiting, and telemetry.",
        difficulty="intermediate", estimated_minutes=75,
        verification_requirement="Submit Go repository with race detector passing cleanly"
    ),
    ActivityCandidate(
        id=13, skill_id=10, skill_slug="security", skill_name="Application Security",
        activity_type="code_challenge", title="OWASP Top 10 Mitigation & Security Middleware",
        description="Implement hardened security middleware for HTTP headers (CSP, HSTS), rate limiting, and token tampering defense.",
        difficulty="intermediate", estimated_minutes=60,
        verification_requirement="Submit security test suite demonstrating defense against token forgery and injection attacks"
    ),
    # Negative/Irrelevant distractors
    ActivityCandidate(
        id=98, skill_id=98, skill_slug="creative-writing", skill_name="Creative Writing",
        activity_type="practice_project", title="Short Story Worldbuilding Workshop",
        description="Write fiction narratives and develop fictional fantasy worlds.",
        difficulty="foundational", estimated_minutes=45,
        verification_requirement="Submit 2000-word draft"
    ),
    ActivityCandidate(
        id=99, skill_id=99, skill_slug="graphic-design", skill_name="Graphic Design",
        activity_type="practice_project", title="Vector Logo Typography",
        description="Design brand assets and vector emblems in Illustrator.",
        difficulty="foundational", estimated_minutes=60,
        verification_requirement="Submit SVG logo design"
    )
]

# 2. Evaluation Cohort (Ground-Truth Relevant Activities per Student Persona)
EVALUATION_COHORT = [
    {
        "persona_id": "P1_distributed_systems_junior",
        "student_context": StudentContext(
            candidate_id=101,
            target_title="Distributed Systems & Cloud Engineer",
            target_skills=["Distributed Systems", "Rust", "Docker", "PostgreSQL"],
            readiness_score=25.0,
            gaps=[
                StudentGapContext(
                    target_requirement="Rust", skill_id=1, skill_slug="rust", skill_name="Rust",
                    gap_state="development_indicated", confidence_score=0.40, proficiency_tier="Foundational",
                    missing_elements=["Demonstrated passing mastery on benchmark concepts"]
                ),
                StudentGapContext(
                    target_requirement="Distributed Systems", skill_id=2, skill_slug="distributed-systems", skill_name="Distributed Systems",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Standardized technical assessment or verified project repository"]
                ),
                StudentGapContext(
                    target_requirement="Docker", skill_id=7, skill_slug="docker", skill_name="Docker",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Containerization proof"]
                ),
                StudentGapContext(
                    target_requirement="PostgreSQL", skill_id=5, skill_slug="postgresql", skill_name="PostgreSQL",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Database architecture proof"]
                )
            ]
        ),
        # Ground-truth relevant activity IDs with graded relevance: 3=highly relevant, 2=relevant, 1=marginally relevant
        "ground_truth_relevance": {
            1: 3,  # Rust benchmark (critical retake for development_indicated)
            3: 3,  # Distributed Systems benchmark (assessment ready for unassessed)
            10: 2, # Docker distroless challenge (foundational calibration)
            4: 2,  # Raft project
            8: 1,  # PostgreSQL outbox
            2: 1   # Rust ring buffer (advanced, harder for foundational tier)
        }
    },
    {
        "persona_id": "P2_backend_platform_architect",
        "student_context": StudentContext(
            candidate_id=102,
            target_title="Backend Platform & API Architect",
            target_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Security"],
            readiness_score=40.0,
            gaps=[
                StudentGapContext(
                    target_requirement="FastAPI", skill_id=4, skill_slug="fastapi", skill_name="FastAPI",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Microservice project evidence"]
                ),
                StudentGapContext(
                    target_requirement="PostgreSQL", skill_id=5, skill_slug="postgresql", skill_name="PostgreSQL",
                    gap_state="evidence_pending", confidence_score=0.50, proficiency_tier="Intermediate",
                    missing_elements=["Assigned faculty mentor review decision"]
                ),
                StudentGapContext(
                    target_requirement="Security", skill_id=10, skill_slug="security", skill_name="Application Security",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Security middleware challenge"]
                ),
                StudentGapContext(
                    target_requirement="Python", skill_id=3, skill_slug="python", skill_name="Python",
                    gap_state="evidence_supports_target", confidence_score=0.90, proficiency_tier="Advanced",
                    missing_elements=[]
                )
            ]
        ),
        "ground_truth_relevance": {
            7: 3,  # FastAPI microservice (closes unassessed core requirement)
            13: 3, # OWASP Security challenge (closes unassessed requirement)
            8: 2,  # PostgreSQL outbox (matches intermediate tier)
            6: 2,  # Python async pipeline (enrichment for supported target)
            10: 1  # Docker
        }
    },
    {
        "persona_id": "P3_systems_software_engineer",
        "student_context": StudentContext(
            candidate_id=103,
            target_title="Low-Latency Systems & Network Engineer",
            target_skills=["Rust", "Go", "Distributed Systems", "Security"],
            readiness_score=25.0,
            gaps=[
                StudentGapContext(
                    target_requirement="Rust", skill_id=1, skill_slug="rust", skill_name="Rust",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Benchmark or verified project"]
                ),
                StudentGapContext(
                    target_requirement="Go", skill_id=9, skill_slug="go", skill_name="Go",
                    gap_state="evidence_rejected", confidence_score=0.30, proficiency_tier="Foundational",
                    missing_elements=["Revised project proof addressing race conditions"]
                ),
                StudentGapContext(
                    target_requirement="Distributed Systems", skill_id=2, skill_slug="distributed-systems", skill_name="Distributed Systems",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Consensus benchmark"]
                )
            ]
        ),
        "ground_truth_relevance": {
            12: 3, # Go worker pool with race detector (direct fix for rejected evidence)
            1: 3,  # Rust benchmark (unassessed benchmark ready)
            3: 3,  # Distributed systems benchmark
            2: 2,  # Rust ring buffer
            4: 2,  # Raft consensus
            13: 1  # Security
        }
    },
    {
        "persona_id": "P4_fullstack_web_architect",
        "student_context": StudentContext(
            candidate_id=104,
            target_title="Full-Stack Web & Cloud Developer",
            target_skills=["React", "Python", "FastAPI", "PostgreSQL", "Docker"],
            readiness_score=40.0,
            gaps=[
                StudentGapContext(
                    target_requirement="React", skill_id=6, skill_slug="react", skill_name="React",
                    gap_state="evidence_supports_target", confidence_score=0.85, proficiency_tier="Intermediate",
                    missing_elements=[]
                ),
                StudentGapContext(
                    target_requirement="FastAPI", skill_id=4, skill_slug="fastapi", skill_name="FastAPI",
                    gap_state="unassessed", confidence_score=0.0, proficiency_tier="Unassessed",
                    missing_elements=["Production API project"]
                ),
                StudentGapContext(
                    target_requirement="Docker", skill_id=7, skill_slug="docker", skill_name="Docker",
                    gap_state="development_indicated", confidence_score=0.30, proficiency_tier="Foundational",
                    missing_elements=["Container hardening mastery"]
                )
            ]
        ),
        "ground_truth_relevance": {
            10: 3, # Docker multi-stage hardening (urgent development_indicated)
            7: 3,  # FastAPI production microservice
            9: 2,  # React accessible design system (enrichment)
            5: 2,  # Python benchmark
            8: 1   # PostgreSQL
        }
    }
]

# 3. Model Implementations
def run_deterministic_baseline(student_ctx: StudentContext, catalogue: List[ActivityCandidate]) -> List[int]:
    """Simulates Phase 9 deterministic heuristic priority rules."""
    scored = []
    gap_skills = {g.skill_id: g for g in student_ctx.gaps if g.skill_id is not None}

    for act in catalogue:
        gap = gap_skills.get(act.skill_id)
        if not gap:
            # Irrelevant to active goal
            continue

        priority = 5
        if gap.gap_state == "development_indicated":
            priority = 1
        elif gap.gap_state == "unassessed":
            priority = 2 if act.activity_type == "assessment" else 4
        elif gap.gap_state in ["evidence_pending", "evidence_rejected"]:
            priority = 3
        elif gap.gap_state == "evidence_supports_target":
            priority = 5

        # Tie-breaker: activity id
        scored.append((priority, act.id))

    scored.sort(key=lambda x: (x[0], x[1]))
    return [act_id for _, act_id in scored]

def run_model_assisted_ranker(
    student_ctx: StudentContext,
    catalogue: List[ActivityCandidate],
    embedder: EmbeddingService
) -> List[int]:
    """Runs the Phase 13 SentenceTransformer + Multi-Factor Semantic Recommendation Engine."""
    student_doc = build_student_context_doc(student_ctx)
    student_vec = embedder.embed(student_doc)

    gap_skills = {g.skill_id: g for g in student_ctx.gaps if g.skill_id is not None}
    scored = []

    W_SIM = 0.40
    W_GAP = 0.30
    W_CALIB = 0.15
    W_PAYOFF = 0.15

    for act in catalogue:
        gap = gap_skills.get(act.skill_id)
        act_doc = build_activity_doc(act)
        act_vec = embedder.embed(act_doc)

        sim = float(np.clip(np.dot(student_vec, act_vec), 0.0, 1.0))
        gap_score = calculate_gap_urgency(gap)
        calib_score = calculate_difficulty_calibration(
            gap.proficiency_tier if gap else "Unassessed",
            gap.gap_state if gap else "unassessed",
            act.difficulty
        )
        payoff_score = calculate_verification_payoff(act)

        # Multi-factor score
        total_score = (W_SIM * sim) + (W_GAP * gap_score) + (W_CALIB * calib_score) + (W_PAYOFF * payoff_score)

        # Filter out completely unrelated catalogue items if no skill alignment
        if gap is None:
            total_score *= 0.30  # penalty for non-goal activities

        scored.append((total_score, act.id))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [act_id for _, act_id in scored]

# 4. Metric Computation Functions
def compute_precision_at_k(recommended_ids: List[int], gt_relevance: Dict[int, int], k: int) -> float:
    top_k = recommended_ids[:k]
    if not top_k:
        return 0.0
    relevant_count = sum(1 for act_id in top_k if gt_relevance.get(act_id, 0) >= 2)
    return relevant_count / k

def compute_recall_at_k(recommended_ids: List[int], gt_relevance: Dict[int, int], k: int) -> float:
    top_k = recommended_ids[:k]
    total_relevant = sum(1 for rel in gt_relevance.values() if rel >= 2)
    if total_relevant == 0:
        return 1.0
    hit_count = sum(1 for act_id in top_k if gt_relevance.get(act_id, 0) >= 2)
    return hit_count / total_relevant

def compute_dcg(relevances: List[int]) -> float:
    dcg = 0.0
    for idx, rel in enumerate(relevances):
        # rel / log2(i + 2)
        dcg += (2**rel - 1) / math.log2(idx + 2)
    return dcg

def compute_ndcg_at_k(recommended_ids: List[int], gt_relevance: Dict[int, int], k: int) -> float:
    top_k = recommended_ids[:k]
    actual_rels = [gt_relevance.get(act_id, 0) for act_id in top_k]
    actual_dcg = compute_dcg(actual_rels)

    ideal_rels = sorted(gt_relevance.values(), reverse=True)[:k]
    ideal_dcg = compute_dcg(ideal_rels)

    if ideal_dcg == 0:
        return 0.0
    return actual_dcg / ideal_dcg

def compute_skill_gap_coverage(
    recommended_ids: List[int],
    student_ctx: StudentContext,
    catalogue: List[ActivityCandidate],
    k: int
) -> float:
    top_k_acts = [act for act in catalogue if act.id in recommended_ids[:k]]
    covered_skills = {act.skill_id for act in top_k_acts if act.skill_id is not None}

    urgent_gaps = [
        g for g in student_ctx.gaps 
        if g.gap_state in ["development_indicated", "unassessed", "evidence_rejected"] and g.skill_id is not None
    ]
    if not urgent_gaps:
        return 1.0

    covered_count = sum(1 for g in urgent_gaps if g.skill_id in covered_skills)
    return covered_count / len(urgent_gaps)

# 5. Main Evaluation Runner
def evaluate_recommendation_system():
    print("=" * 80)
    print(" SKILLVERSE PHASE 13: OFFLINE EVALUATION OF AI LEARNING RECOMMENDATION ENGINE")
    print(" Model: all-MiniLM-L6-v2 (SentenceTransformers) + Multi-Factor Grounded Ranker")
    print("=" * 80)

    embedder = EmbeddingService()
    _ = embedder.embed("Warmup evaluation embedder")

    K_VALUES = [3, 5]
    results = {
        "baseline": {k: {"p": [], "r": [], "ndcg": [], "cov": []} for k in K_VALUES},
        "model_assisted": {k: {"p": [], "r": [], "ndcg": [], "cov": []} for k in K_VALUES}
    }

    print("\n--- INDIVIDUAL PERSONA RESULTS ---\n")
    for item in EVALUATION_COHORT:
        persona_id = item["persona_id"]
        ctx = item["student_context"]
        gt = item["ground_truth_relevance"]

        base_ranked = run_deterministic_baseline(ctx, CATALOGUE)
        model_ranked = run_model_assisted_ranker(ctx, CATALOGUE, embedder)

        print(f"Persona: {persona_id} (Target: {ctx.target_title})")
        print(f"  Deterministic Top 3: {base_ranked[:3]}")
        print(f"  AI Model Top 3:      {model_ranked[:3]}")

        for k in K_VALUES:
            # Baseline
            bp = compute_precision_at_k(base_ranked, gt, k)
            br = compute_recall_at_k(base_ranked, gt, k)
            bndcg = compute_ndcg_at_k(base_ranked, gt, k)
            bcov = compute_skill_gap_coverage(base_ranked, ctx, CATALOGUE, k)

            results["baseline"][k]["p"].append(bp)
            results["baseline"][k]["r"].append(br)
            results["baseline"][k]["ndcg"].append(bndcg)
            results["baseline"][k]["cov"].append(bcov)

            # Model-Assisted
            mp = compute_precision_at_k(model_ranked, gt, k)
            mr = compute_recall_at_k(model_ranked, gt, k)
            mndcg = compute_ndcg_at_k(model_ranked, gt, k)
            mcov = compute_skill_gap_coverage(model_ranked, ctx, CATALOGUE, k)

            results["model_assisted"][k]["p"].append(mp)
            results["model_assisted"][k]["r"].append(mr)
            results["model_assisted"][k]["ndcg"].append(mndcg)
            results["model_assisted"][k]["cov"].append(mcov)

            print(f"  [@K={k}] Baseline: P={bp:.3f}, R={br:.3f}, NDCG={bndcg:.3f}, Cov={bcov*100:.1f}% | AI: P={mp:.3f}, R={mr:.3f}, NDCG={mndcg:.3f}, Cov={mcov*100:.1f}%")
        print("-" * 60)

    # 6. Aggregate Summary Table
    print("\n" + "=" * 80)
    print(" AGGREGATE EVALUATION SUMMARY: DETERMINISTIC BASELINE vs. AI MODEL-ASSISTED")
    print("=" * 80)
    print(f"{'Metric':<20} | {'Deterministic Baseline':<25} | {'AI Recommendation Engine':<25} | {'Delta':<10}")
    print("-" * 86)

    final_metrics = {}
    for k in K_VALUES:
        bp_mean = float(np.mean(results["baseline"][k]["p"]))
        mp_mean = float(np.mean(results["model_assisted"][k]["p"]))
        p_delta = mp_mean - bp_mean
        print(f"Precision@{k:<10} | {bp_mean:>24.4f}  | {mp_mean:>24.4f}  | {p_delta:>+9.4f}")

        br_mean = float(np.mean(results["baseline"][k]["r"]))
        mr_mean = float(np.mean(results["model_assisted"][k]["r"]))
        r_delta = mr_mean - br_mean
        print(f"Recall@{k:<13} | {br_mean:>24.4f}  | {mr_mean:>24.4f}  | {r_delta:>+9.4f}")

        bndcg_mean = float(np.mean(results["baseline"][k]["ndcg"]))
        mndcg_mean = float(np.mean(results["model_assisted"][k]["ndcg"]))
        ndcg_delta = mndcg_mean - bndcg_mean
        print(f"NDCG@{k:<15} | {bndcg_mean:>24.4f}  | {mndcg_mean:>24.4f}  | {ndcg_delta:>+9.4f}")

        bcov_mean = float(np.mean(results["baseline"][k]["cov"]))
        mcov_mean = float(np.mean(results["model_assisted"][k]["cov"]))
        cov_delta = (mcov_mean - bcov_mean) * 100
        print(f"Gap Coverage@{k:<8} | {bcov_mean*100:>23.1f}%  | {mcov_mean*100:>23.1f}%  | {cov_delta:>+8.1f}%")
        print("-" * 86)

        final_metrics[f"k_{k}"] = {
            "baseline": {"precision": round(bp_mean, 4), "recall": round(br_mean, 4), "ndcg": round(bndcg_mean, 4), "coverage": round(bcov_mean, 4)},
            "model_assisted": {"precision": round(mp_mean, 4), "recall": round(mr_mean, 4), "ndcg": round(mndcg_mean, 4), "coverage": round(mcov_mean, 4)},
            "delta": {"precision": round(p_delta, 4), "recall": round(r_delta, 4), "ndcg": round(ndcg_delta, 4), "coverage_pct": round(cov_delta, 2)}
        }

    return final_metrics

if __name__ == "__main__":
    evaluate_recommendation_system()
