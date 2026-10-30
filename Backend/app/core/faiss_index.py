# Backend/app/core/faiss_index.py
import faiss
import numpy as np
import json
import os
from typing import List, Dict, Any

def resolve_path(path_str: str) -> str:
    if os.path.isabs(path_str) and os.path.exists(path_str):
        return path_str
    if os.path.exists(path_str):
        return os.path.abspath(path_str)
    # Check relative to Backend root (two levels up from app/core)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidate = os.path.join(base_dir, path_str)
    if os.path.exists(candidate):
        return candidate
    return path_str

class FaissIndex:
    def __init__(self, index_path: str = "models/faiss.index", meta_path: str = "models/meta.json"):
        resolved_index = resolve_path(index_path)
        resolved_meta = resolve_path(meta_path)

        if not os.path.exists(resolved_index):
            raise FileNotFoundError(f"FAISS index file not found at: {resolved_index}")
        if not os.path.exists(resolved_meta):
            raise FileNotFoundError(f"Metadata file not found at: {resolved_meta}")

        self.index = faiss.read_index(resolved_index)
        with open(resolved_meta, "r", encoding="utf-8") as f:
            self.meta = json.load(f)

    def search(self, vector: np.ndarray, top_k: int = 10) -> List[Dict[str, Any]]:
        q = np.array([vector]).astype("float32")
        faiss.normalize_L2(q)

        # Cap top_k at number of vectors in index
        total_vectors = self.index.ntotal
        actual_k = min(top_k, total_vectors)
        if actual_k <= 0:
            return []

        distances, indices = self.index.search(q, actual_k)

        results = []
        for score, idx in zip(distances[0], indices[0]):
            idx_str = str(idx)
            if idx_str in self.meta:
                meta = self.meta[idx_str]
                results.append({
                    "candidate_id": meta.get("candidate_id", idx),
                    "skills": meta.get("skills", []),
                    "experience": meta.get("experience", 0),
                    "projects": meta.get("projects", []),
                    "resume_text": meta.get("resume_text", ""),
                    "embedding_sim": float(score)
                })
        return results
