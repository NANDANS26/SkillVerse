# Backend/tests/test_fastapi_server.py
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from app.main import app

class TestFastAPIServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "SkillVerse AI Intelligence Backend")

    def test_health_endpoint(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["message"], "ML service running")

    def test_parse_jd_endpoint(self):
        res = self.client.post("/api/v1/parse_jd", json={
            "text": "Looking for Senior React, TypeScript, and Node.js developer."
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        skills = data["skills_extracted"]
        self.assertIn("React", skills)
        self.assertIn("TypeScript", skills)

    def test_embed_candidate_endpoint_security_and_indexing(self):
        # 1. Missing token must return 401 Unauthorized
        res_unauth = self.client.post(
            "/api/v1/embed_candidate",
            json={"candidate": {"id": 1, "headline": "Test Student", "skills": ["Python"]}}
        )
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Invalid token must return 403 Forbidden
        res_forbidden = self.client.post(
            "/api/v1/embed_candidate",
            json={"candidate": {"id": 1, "headline": "Test Student", "skills": ["Python"]}},
            headers={"X-Service-Token": "invalid-secret"}
        )
        self.assertEqual(res_forbidden.status_code, 403)

        # 3. Valid token must succeed with 200 OK
        res = self.client.post(
            "/api/v1/embed_candidate",
            json={"candidate": {"id": 1, "headline": "Test Student", "skills": ["Python"]}},
            headers={"X-Service-Token": "skillverse-internal-service-secret-local-dev"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "indexed")
        self.assertIn("successfully indexed", data["message"])

    def test_match_endpoint_when_dependencies_missing(self):
        # Testing match endpoint error behavior when heavyweight models are uninstalled
        res = self.client.post("/api/v1/match", json={
            "job": {
                "title": "Software Engineer",
                "required_skills": ["React"],
                "experience_min": 1,
                "experience_max": 4
            },
            "top_k": 5
        })
        # If sentence_transformers or faiss is missing in environment, it should report clean 500 error, not crash the process
        if res.status_code == 200:
            data = res.json()
            self.assertTrue(data["success"])
            self.assertIn("matches", data)
        else:
            self.assertEqual(res.status_code, 500)
            self.assertIn("detail", res.json())
            print(f"Observed model loading detail: {res.json()['detail']}")

if __name__ == "__main__":
    unittest.main()
