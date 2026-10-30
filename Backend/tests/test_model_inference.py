# Backend/tests/test_model_inference.py
import unittest
import os
import sys
import pickle
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.ranker import Ranker

class TestRealRankerInference(unittest.TestCase):
    def test_ranker_artifact_loading_and_prediction(self):
        """
        Label: REAL_MODEL_INFERENCE (Ranker)
        Executes genuine inference using the committed LightGBM model artifact (models/ranker.pkl).
        """
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "ranker.pkl"))
        self.assertTrue(os.path.exists(model_path), "ranker.pkl must exist in models/")

        ranker = Ranker(model_path)
        self.assertIsNotNone(ranker.model)

        # 1. High match candidate: strong similarity, high skill overlap, perfect exp match
        high_item = {
            "embedding_sim": 0.90,
            "skill_overlap": 0.85,
            "exp_match": 1.0
        }
        high_score = ranker.score(high_item)
        self.assertIsInstance(high_score, float)
        self.assertGreater(high_score, 0.7, "Strong candidate should receive high ranker score")

        # 2. Low match candidate: weak similarity, no skill overlap, experience mismatch
        low_item = {
            "embedding_sim": 0.20,
            "skill_overlap": 0.0,
            "exp_match": 0.0
        }
        low_score = ranker.score(low_item)
        self.assertIsInstance(low_score, float)
        self.assertLess(low_score, high_score, "Weak candidate should receive lower score than strong candidate")

        print(f"\n[REAL_MODEL_INFERENCE] High match score: {high_score:.4f}, Low match score: {low_score:.4f}")

if __name__ == "__main__":
    unittest.main()
