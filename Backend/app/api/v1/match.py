from fastapi import APIRouter
from pydantic import BaseModel
import json
from app.core.embeddings import EmbeddingService
from app.core.faiss_index import FaissIndex
from app.core.ranker import Ranker

router = APIRouter()

embedder = EmbeddingService()
index = FaissIndex("models/faiss.index", "models/meta.json")
ranker = Ranker("models/ranker.pkl")

class MatchReq(BaseModel):
    job: dict
    top_k: int = 10

@router.post("/match")
def match(req: MatchReq):
    job = req.job

    job_doc = embedder.build_job_doc(job)
    job_vec = embedder.embed(job_doc)

    raw_results = index.search(job_vec, top_k=req.top_k)

    final = []
    for r in raw_results:
        j_skills = set(job["required_skills"])
        c_skills = set(r["skills"])

        skill_overlap = len(j_skills & c_skills) / len(j_skills)

        exp_match = 1 if job["exp_min"] <= r["experience"] <= job["exp_max"] else 0

        score = ranker.score({
            "embedding_sim": r["embedding_sim"],
            "skill_overlap": skill_overlap,
            "exp_match": exp_match
        })

        r["skill_overlap"] = skill_overlap
        r["exp_match"] = exp_match
        r["match_score"] = score

        final.append(r)

    final_sorted = sorted(final, key=lambda x: x["match_score"], reverse=True)
    return {"results": final_sorted}
