# Backend/tests/test_recommend_activities.py
import unittest
import json
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import DEFAULT_SECRET

client = TestClient(app)

class TestRecommendActivities(unittest.TestCase):
    def setUp(self):
        self.auth_headers = {
            "X-Service-Token": DEFAULT_SECRET,
            "Content-Type": "application/json"
        }
        self.sample_payload = {
            "student_context": {
                "candidate_id": 42,
                "target_title": "Distributed Systems Engineer",
                "target_skills": ["Rust", "Distributed Systems", "Docker"],
                "readiness_score": 33.3,
                "gaps": [
                    {
                        "target_requirement": "Rust",
                        "skill_id": 1,
                        "skill_slug": "rust",
                        "skill_name": "Rust",
                        "gap_state": "development_indicated",
                        "confidence_score": 0.45,
                        "proficiency_tier": "Foundational",
                        "missing_elements": ["Demonstrated passing mastery on benchmark concepts"]
                    },
                    {
                        "target_requirement": "Distributed Systems",
                        "skill_id": 2,
                        "skill_slug": "distributed-systems",
                        "skill_name": "Distributed Systems",
                        "gap_state": "unassessed",
                        "confidence_score": 0.0,
                        "proficiency_tier": "Unassessed",
                        "missing_elements": ["Standardized technical assessment or verified project repository"]
                    }
                ]
            },
            "candidate_activities": [
                {
                    "id": 101,
                    "skill_id": 1,
                    "skill_slug": "rust",
                    "skill_name": "Rust",
                    "activity_type": "assessment",
                    "title": "Rust Systems Engineering Technical Benchmark",
                    "description": "Evaluate Rust ownership semantics, borrow checker rules, and RAII memory safety.",
                    "difficulty": "intermediate",
                    "estimated_minutes": 15,
                    "assessment_slug": "rust-systems-foundations",
                    "verification_requirement": "Complete server-graded benchmark assessment with score >= 60%"
                },
                {
                    "id": 102,
                    "skill_id": 1,
                    "skill_slug": "rust",
                    "skill_name": "Rust",
                    "activity_type": "practice_project",
                    "title": "Zero-Copy Lock-Free Ring Buffer in Rust",
                    "description": "Implement thread-safe lock-free ring buffer for asynchronous streaming.",
                    "difficulty": "advanced",
                    "estimated_minutes": 120,
                    "verification_requirement": "Submit public GitHub repository with comprehensive unit tests"
                },
                {
                    "id": 103,
                    "skill_id": 2,
                    "skill_slug": "distributed-systems",
                    "skill_name": "Distributed Systems",
                    "activity_type": "assessment",
                    "title": "Distributed Consensus & Fault Tolerance Technical Benchmark",
                    "description": "Test competencies in Paxos, Raft leader election, and partition recovery.",
                    "difficulty": "intermediate",
                    "estimated_minutes": 15,
                    "assessment_slug": "distributed-systems-consensus",
                    "verification_requirement": "Complete server-graded benchmark assessment with score >= 60%"
                },
                {
                    "id": 104,
                    "skill_id": 99,
                    "skill_slug": "graphic-design",
                    "skill_name": "Graphic Design",
                    "activity_type": "practice_project",
                    "title": "Logo Design in Illustrator",
                    "description": "Create vector logos for marketing collateral.",
                    "difficulty": "foundational",
                    "estimated_minutes": 60,
                    "verification_requirement": "Submit SVG file"
                }
            ],
            "top_k": 3
        }

    def test_auth_enforcement(self):
        # Missing token
        res_no_auth = client.post("/api/v1/recommend_activities", json=self.sample_payload)
        self.assertEqual(res_no_auth.status_code, 401)

        # Invalid token
        res_bad_auth = client.post(
            "/api/v1/recommend_activities",
            headers={"X-Service-Token": "invalid-token"},
            json=self.sample_payload
        )
        self.assertEqual(res_bad_auth.status_code, 403)

    def test_recommend_activities_success_contract(self):
        res = client.post(
            "/api/v1/recommend_activities",
            headers=self.auth_headers,
            json=self.sample_payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("engine_version"), "v2.0.0-ai-semantic-recommendation")
        self.assertEqual(data.get("model_version"), "all-MiniLM-L6-v2")
        self.assertEqual(len(data.get("recommendations")), 3)

        first_rec = data["recommendations"][0]
        self.assertIn("ranking_score", first_rec)
        self.assertIn("semantic_similarity", first_rec)
        self.assertIn("scoring_breakdown", first_rec)
        self.assertIn("explanation", first_rec)

        explanation = first_rec["explanation"]
        self.assertIn("primary_driver", explanation)
        self.assertIn("semantic_relevance_pct", explanation)
        self.assertIn("rationale_text", explanation)

        # Confirm scores are properly bounded in [0.0, 1.0]
        for rec in data["recommendations"]:
            self.assertGreaterEqual(rec["ranking_score"], 0.0)
            self.assertLessEqual(rec["ranking_score"], 1.0)
            self.assertGreaterEqual(rec["semantic_similarity"], 0.0)
            self.assertLessEqual(rec["semantic_similarity"], 1.0)

    def test_ranking_prefers_relevant_technical_over_unrelated(self):
        res = client.post(
            "/api/v1/recommend_activities",
            headers=self.auth_headers,
            json=self.sample_payload
        )
        self.assertEqual(res.status_code, 200)
        recs = res.json()["recommendations"]
        rec_ids = [r["activity_id"] for r in recs]

        # The unrelated activity (104 - Graphic Design) should not be in the top 3
        self.assertNotIn(104, rec_ids)

        # The urgent development-indicated Rust benchmark should be ranked near top
        self.assertIn(101, rec_ids)

    def test_empty_candidates_returns_empty_list(self):
        empty_payload = dict(self.sample_payload)
        empty_payload["candidate_activities"] = []
        res = client.post(
            "/api/v1/recommend_activities",
            headers=self.auth_headers,
            json=empty_payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["count"], 0)
        self.assertEqual(data["recommendations"], [])

if __name__ == "__main__":
    unittest.main()
