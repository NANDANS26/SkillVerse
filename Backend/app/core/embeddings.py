from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text: str):
        vec = self.model.encode(text, convert_to_numpy=True).astype("float32")
        norm = np.linalg.norm(vec)
        return vec / norm if norm != 0 else vec

    def build_job_doc(self, job):
        return (
            f"{job['title']} . Required Skills: {', '.join(job['required_skills'])} . "
            f"Experience: {job['exp_min']}-{job['exp_max']} years."
        )

    def build_candidate_doc(self, candidate):
        return candidate["resume_text"]
