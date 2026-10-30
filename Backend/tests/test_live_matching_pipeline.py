# Backend/tests/test_live_matching_pipeline.py
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

class TestLiveMatchingPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_and_root(self):
        r_root = self.client.get("/")
        self.assertEqual(r_root.status_code, 200)
        self.assertEqual(r_root.json()["status"], "ok")

        r_health = self.client.get("/api/v1/health")
        self.assertEqual(r_health.status_code, 200)
        self.assertEqual(r_health.json()["status"], "ok")

    def test_parse_jd_endpoint(self):
        payload = {"text": "We are seeking a Senior Full-Stack React and TypeScript Engineer with PostgreSQL expertise."}
        r = self.client.post("/api/v1/parse_jd", json=payload)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["success"])
        self.assertIn("React", data["skills_extracted"])
        self.assertIn("TypeScript", data["skills_extracted"])

    def test_match_endpoint_full_pipeline(self):
        payload = {
            "job": {
                "id": 1,
                "title": "Senior Frontend Developer",
                "required_skills": ["React", "TypeScript", "Node.js"],
                "experience_min": 2,
                "experience_max": 6,
                "exp_min": 2,
                "exp_max": 6,
                "raw_text": "Looking for an experienced React and TypeScript developer with frontend skills."
            },
            "top_k": 5
        }
        r = self.client.post("/api/v1/match", json=payload)
        print("\n--- MATCH ENDPOINT RESPONSE ---")
        print("Status:", r.status_code)
        try:
            res_json = r.json()
            print("Response Keys:", list(res_json.keys()))
            if "matches" in res_json:
                print("Matches count:", len(res_json["matches"]))
                if res_json["matches"]:
                    print("Top match sample:", {
                        k: res_json["matches"][0].get(k)
                        for k in ["candidate_id", "match_score", "skill_overlap", "embedding_sim"]
                    })
        except Exception as e:
            print("Response text:", r.text)
        print("-------------------------------\n")

        self.assertEqual(r.status_code, 200, f"Match endpoint failed: {r.text}")
        data = r.json()
        self.assertTrue(data.get("success", False))
        self.assertIn("matches", data)
        self.assertIn("count", data)

if __name__ == "__main__":
    unittest.main()
