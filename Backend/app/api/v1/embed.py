# Backend/app/api/v1/embed.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
import json
import os

from app.core.live_index import get_live_index
from app.core.auth import verify_service_token

router = APIRouter()

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        from app.core.embeddings import EmbeddingService
        _embedder = EmbeddingService()
    return _embedder

class EmbedCandidateReq(BaseModel):
    candidate: Optional[Dict[str, Any]] = None
    candidate_id: Optional[Union[int, str]] = None
    full_name: Optional[str] = ""
    headline: Optional[str] = ""
    email: Optional[str] = ""
    experience_years: Optional[float] = 0.0
    resume_text: Optional[str] = ""
    skill_json: Optional[Union[List[str], str]] = None

class ReindexAllReq(BaseModel):
    candidates: List[Dict[str, Any]]

@router.post("/embed_candidate", dependencies=[Depends(verify_service_token)])
def embed_candidate(req: EmbedCandidateReq):
    try:
        # Extract candidate data from either nested 'candidate' object or top-level fields
        candidate_data = dict(req.candidate) if req.candidate else req.model_dump()

        cid = candidate_data.get("candidate_id") or candidate_data.get("id")
        if cid is None:
            raise ValueError("candidate_id is required for dynamic indexing")

        cid = int(cid)
        embedder = get_embedder()
        live_idx = get_live_index()

        doc = embedder.build_candidate_doc(candidate_data)
        vec = embedder.embed(doc)

        # Parse skills if serialized
        raw_skills = candidate_data.get("skill_json") or candidate_data.get("skills") or []
        if isinstance(raw_skills, str):
            try:
                skills = json.loads(raw_skills)
            except:
                skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
        else:
            skills = raw_skills

        metadata = {
            "candidate_id": cid,
            "full_name": candidate_data.get("full_name") or candidate_data.get("name", ""),
            "headline": candidate_data.get("headline", ""),
            "email": candidate_data.get("email", ""),
            "skills": skills,
            "experience": float(candidate_data.get("experience_years") or candidate_data.get("experience", 0.0) or 0.0),
            "resume_text": candidate_data.get("resume_text", "")
        }

        live_idx.upsert_candidate(cid, vec, metadata)

        return {
            "success": True,
            "status": "indexed",
            "message": f"Candidate {cid} successfully indexed in dynamic vector store",
            "candidate_id": cid,
            "total_indexed": live_idx.total_candidates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dynamic indexing failed: {str(e)}")

@router.post("/reindex_all", dependencies=[Depends(verify_service_token)])
def reindex_all(req: ReindexAllReq):
    try:
        embedder = get_embedder()
        live_idx = get_live_index()

        count = live_idx.rebuild_all(req.candidates, embedder)
        return {
            "success": True,
            "status": "rebuilt",
            "message": f"Successfully rebuilt live candidate index with {count} records",
            "total_indexed": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")

@router.delete("/candidate/{candidate_id}", dependencies=[Depends(verify_service_token)])
def delete_candidate_vector(candidate_id: int):
    live_idx = get_live_index()
    removed = live_idx.remove_candidate(candidate_id)
    return {
        "success": True,
        "removed": removed,
        "candidate_id": candidate_id,
        "total_indexed": live_idx.total_candidates
    }

@router.get("/index_status")
def index_status():
    live_idx = get_live_index()
    try:
        from app.api.v1.match import get_services
        _, benchmark_idx, _ = get_services()
        benchmark_count = benchmark_idx.index.ntotal if benchmark_idx else 0
    except:
        benchmark_count = 0

    return {
        "live_index": {
            "total_candidates": live_idx.total_candidates,
            "dimensions": live_idx.DIMENSION,
            "model": "all-MiniLM-L6-v2",
            "source": "PostgreSQL candidate database",
            "has_backup_snapshot": os.path.exists(live_idx.bak_index_path) and os.path.exists(live_idx.bak_meta_path)
        },
        "benchmark_index": {
            "total_candidates": benchmark_count,
            "dimensions": 384,
            "model": "all-MiniLM-L6-v2",
            "source": "Static evaluation benchmark"
        }
    }
