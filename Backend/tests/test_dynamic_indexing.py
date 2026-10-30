# Backend/tests/test_dynamic_indexing.py
"""
Direct unit and integration tests for LiveCandidateIndex and dynamic matching endpoints.
"""
import unittest
import os
import sys
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.live_index import LiveCandidateIndex, get_live_index
from app.core.embeddings import EmbeddingService
from app.core.ranker import Ranker

class TestDynamicCandidateIndexing(unittest.TestCase):
    def test_live_index_upsert_and_search(self):
        """Verify IndexIDMap2 upsert, replacement idempotency, and search."""
        idx = LiveCandidateIndex()
        test_cid = 999999
        # Ensure clean initial state for test candidate ID
        idx.remove_candidate(test_cid)
        initial_count = idx.total_candidates
        dim = 384
        vec = np.random.randn(dim).astype(np.float32)
        vec = vec / np.linalg.norm(vec)

        metadata = {
            "candidate_id": test_cid,
            "full_name": "Test Dynamic Candidate",
            "headline": "Quantum Computing Specialist",
            "email": "dynamic_test@skillverse.test",
            "skills": ["Quantum Computing", "Qiskit", "Python"],
            "experience": 5.0,
            "resume_text": "Expert in quantum error correction and Qiskit algorithms."
        }

        # 1. Upsert new candidate
        idx.upsert_candidate(test_cid, vec, metadata)
        self.assertEqual(idx.total_candidates, initial_count + 1)
        self.assertIn(str(test_cid), idx.meta)

        # 2. Search for this candidate using the identical vector (cosine similarity ~ 1.0)
        results = idx.search(vec, top_k=5)
        matched_ids = [r["candidate_id"] for r in results]
        self.assertIn(test_cid, matched_ids)
        top_match = next(r for r in results if r["candidate_id"] == test_cid)
        self.assertGreater(top_match["embedding_sim"], 0.99)
        self.assertEqual(top_match["headline"], "Quantum Computing Specialist")

        # 3. Idempotent replacement: Update candidate with new vector and metadata
        vec_updated = np.random.randn(dim).astype(np.float32)
        vec_updated = vec_updated / np.linalg.norm(vec_updated)
        metadata["headline"] = "Senior Quantum & Photonic Architect"
        idx.upsert_candidate(test_cid, vec_updated, metadata)

        # Count must remain the same (idempotent)
        self.assertEqual(idx.total_candidates, initial_count + 1)
        self.assertEqual(idx.meta[str(test_cid)]["headline"], "Senior Quantum & Photonic Architect")

        # 4. Remove candidate
        idx.remove_candidate(test_cid)
        self.assertEqual(idx.total_candidates, initial_count)
        self.assertNotIn(str(test_cid), idx.meta)

    def test_embed_candidate_doc_generation(self):
        """Verify candidate document text assembly formatting."""
        embedder = EmbeddingService()
        candidate = {
            "full_name": "Test Engineer",
            "headline": "Cloud Native Architect",
            "skill_json": ["Kubernetes", "Go", "GCP"],
            "experience_years": 6.5,
            "resume_text": "Extensive experience orchestrating microservices in GKE."
        }
        doc = embedder.build_candidate_doc(candidate)
        self.assertIn("Cloud Native Architect", doc)
        self.assertIn("Kubernetes, Go, GCP", doc)
        self.assertIn("6.5 years", doc)
        self.assertIn("Extensive experience orchestrating", doc)

    def test_live_matching_ranker_scoring(self):
        """Verify LightGBM ranker scores live candidate features."""
        ranker = Ranker()
        score_high = ranker.score({"embedding_sim": 0.85, "skill_overlap": 0.9, "exp_match": 1.0})
        score_low = ranker.score({"embedding_sim": 0.2, "skill_overlap": 0.0, "exp_match": 0.0})
        self.assertIsInstance(score_high, float)
        self.assertIsInstance(score_low, float)
        self.assertGreater(score_high, score_low)

if __name__ == "__main__":
    unittest.main()
