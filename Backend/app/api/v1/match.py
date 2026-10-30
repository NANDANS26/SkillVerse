# Backend/app/api/v1/match.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

router = APIRouter()

_embedder = None
_index = None
_ranker = None

def get_services():
    global _embedder, _index, _ranker
    if _embedder is None:
        from app.core.embeddings import EmbeddingService
        _embedder = EmbeddingService()
    if _index is None:
        from app.core.faiss_index import FaissIndex
        _index = FaissIndex()
    if _ranker is None:
        from app.core.ranker import Ranker
        _ranker = Ranker()
    return _embedder, _index, _ranker

class JobPayload(BaseModel):
    id: Optional[Union[int, str]] = None
    title: Optional[str] = "Software Engineer"
    required_skills: Optional[List[str]] = Field(default_factory=list)
    raw_text: Optional[str] = ""
    description: Optional[str] = ""
    experience_min: Optional[float] = 0.0
    experience_max: Optional[float] = 10.0
    exp_min: Optional[float] = None
    exp_max: Optional[float] = None

class MatchReq(BaseModel):
    job: JobPayload
    top_k: int = Field(default=10, ge=1, le=100)
    mode: Optional[str] = "live"  # "live" (PostgreSQL candidates) or "benchmark" (static evaluation set)

@router.post("/match")
def match(req: MatchReq):
    try:
        embedder, benchmark_index, ranker = get_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI model loading failed: {str(e)}")

    job_dict = req.job.model_dump()
    exp_min = job_dict.get("exp_min")
    if exp_min is None:
        exp_min = job_dict.get("experience_min", 0.0) or 0.0

    exp_max = job_dict.get("exp_max")
    if exp_max is None:
        exp_max = job_dict.get("experience_max", 10.0) or 10.0

    job_dict["exp_min"] = float(exp_min)
    job_dict["exp_max"] = float(exp_max)

    mode = req.mode.lower() if req.mode else "live"

    try:
        job_doc = embedder.build_job_doc(job_dict)
        job_vec = embedder.embed(job_doc)

        if mode == "benchmark":
            search_k = max(req.top_k * 5, 50)
            raw_results = benchmark_index.search(job_vec, top_k=search_k)
        else:
            from app.core.live_index import get_live_index
            live_idx = get_live_index()
            if live_idx.total_candidates == 0:
                return {
                    "success": True,
                    "matches": [],
                    "results": [],
                    "count": 0,
                    "mode": "live",
                    "message": "No live candidate profiles indexed yet"
                }
            search_k = min(max(req.top_k * 5, 50), live_idx.total_candidates)
            raw_results = live_idx.search(job_vec, top_k=search_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding or vector search error: {str(e)}")

    req_skills_list = job_dict.get("required_skills") or []
    j_skills = set(s.lower().strip() for s in req_skills_list if isinstance(s, str))

    final = []
    for r in raw_results:
        candidate_skills = r.get("skills") or []
        c_skills = set(s.lower().strip() for s in candidate_skills if isinstance(s, str))

        # Safe skill overlap calculation to prevent division by zero
        if len(j_skills) > 0:
            skill_overlap = len(j_skills & c_skills) / len(j_skills)
        else:
            skill_overlap = 0.5  # Neutral overlap score when no specific skills are mandated

        candidate_exp = float(r.get("experience", 0.0))
        exp_match = 1.0 if (exp_min <= candidate_exp <= exp_max) else 0.0

        score = ranker.score({
            "embedding_sim": r.get("embedding_sim", 0.0),
            "skill_overlap": skill_overlap,
            "exp_match": exp_match
        })

        item = dict(r)
        item["skill_overlap"] = round(float(skill_overlap), 4)
        item["exp_match"] = int(exp_match)
        item["match_score"] = round(float(score), 4)
        item["source"] = "postgresql_live" if mode != "benchmark" else "benchmark"

        # Filter out candidates who do not meet match criteria
        # A candidate with 0 skill overlap and 0 experience match whose ranker score is negligible (< 0.1) is not a genuine match
        if score >= 0.1 or (len(j_skills) == 0 and exp_match == 1.0):
            final.append(item)

    final_sorted = sorted(
        final,
        key=lambda x: (
            x["match_score"],
            x["skill_overlap"],
            x["embedding_sim"],
            int(x.get("candidate_id") or x.get("id") or 0)
        ),
        reverse=True
    )[:req.top_k]
    return {
        "success": True,
        "matches": final_sorted,
        "results": final_sorted,
        "count": len(final_sorted),
        "mode": mode
    }
