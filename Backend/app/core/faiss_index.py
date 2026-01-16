import faiss
import numpy as np
import json
import os

class FaissIndex:
    def __init__(self, index_path, meta_path):
        self.index = faiss.read_index(index_path)
        self.meta = json.load(open(meta_path))

    def search(self, vector, top_k=20):
        q = np.array([vector]).astype("float32")
        faiss.normalize_L2(q)

        distances, indices = self.index.search(q, top_k)

        results = []
        for score, idx in zip(distances[0], indices[0]):
            meta = self.meta[str(idx)]
            results.append({
                "candidate_id": meta["candidate_id"],
                "skills": meta["skills"],
                "experience": meta["experience"],
                "projects": meta["projects"],
                "resume_text": meta["resume_text"],
                "embedding_sim": float(score)
            })
        return results
