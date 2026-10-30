# Backend/app/core/embeddings.py
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Dict, Any, Union

class EmbeddingService:
    def __init__(self):
        self._model = None

    @property
    def model(self):
        if self._model is None:
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model

    def embed(self, text: str):
        if not text:
            text = "general software engineering"
        vec = self.model.encode(text, convert_to_numpy=True).astype("float32")
        norm = np.linalg.norm(vec)
        return vec / norm if norm != 0 else vec

    def build_job_doc(self, job: Dict[str, Any]) -> str:
        title = job.get("title", "Software Engineer")
        skills = job.get("required_skills", [])
        if isinstance(skills, list):
            skills_str = ", ".join(str(s) for s in skills)
        else:
            skills_str = str(skills)

        exp_min = job.get("exp_min", job.get("experience_min", 0))
        exp_max = job.get("exp_max", job.get("experience_max", 10))
        raw_text = job.get("raw_text", job.get("description", ""))

        parts = [f"Job Title: {title}"]
        if skills_str:
            parts.append(f"Required Skills: {skills_str}")
        parts.append(f"Experience: {exp_min} to {exp_max} years.")
        if raw_text:
            parts.append(str(raw_text))

        return " . ".join(parts)

    def build_candidate_doc(self, candidate: Dict[str, Any]) -> str:
        headline = candidate.get("headline") or ""
        skills = candidate.get("skills") or candidate.get("skill_json") or []
        if isinstance(skills, str):
            try:
                import json
                skills = json.loads(skills)
            except:
                skills = [s.strip() for s in skills.split(",") if s.strip()]
        skills_str = ", ".join(str(s) for s in skills) if isinstance(skills, list) else str(skills)
        exp = candidate.get("experience_years", candidate.get("experience", 0))
        resume = candidate.get("resume_text", "")

        parts = []
        if headline:
            parts.append(f"Headline: {headline}")
        if skills_str:
            parts.append(f"Skills: {skills_str}")
        if exp:
            parts.append(f"Experience: {exp} years")
        if resume:
            parts.append(str(resume))

        return " . ".join(parts) if parts else "Software Engineer"
