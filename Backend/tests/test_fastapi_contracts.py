# Backend/tests/test_fastapi_contracts.py
import unittest
import sys
import os

# Add Backend root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.v1.match import JobPayload, MatchReq
from app.api.v1.parse import ParseReq, parse_jd

class TestFastAPIContracts(unittest.TestCase):
    def test_job_payload_defaults_and_aliases(self):
        # Test default values
        job = JobPayload()
        self.assertEqual(job.title, "Software Engineer")
        self.assertEqual(job.required_skills, [])
        self.assertEqual(job.experience_min, 0.0)
        self.assertEqual(job.experience_max, 10.0)

    def test_job_payload_with_custom_values(self):
        job = JobPayload(
            title="Senior React Engineer",
            required_skills=["React", "TypeScript", "Node.js"],
            experience_min=3.0,
            experience_max=7.0,
            raw_text="Lead frontend development"
        )
        self.assertEqual(job.title, "Senior React Engineer")
        self.assertEqual(len(job.required_skills), 3)
        self.assertEqual(job.experience_min, 3.0)

    def test_match_req_structure(self):
        req = MatchReq(job=JobPayload(title="AI Engineer"), top_k=5)
        self.assertEqual(req.top_k, 5)
        self.assertEqual(req.job.title, "AI Engineer")

    def test_parse_jd_handles_empty_and_valid_text(self):
        # Empty text must not crash
        res_empty = parse_jd(ParseReq(text=""))
        self.assertTrue(res_empty["success"])
        self.assertEqual(res_empty["skills_extracted"], [])

        # Proper text extraction
        res_valid = parse_jd(ParseReq(text="Looking for Python, React, and Docker engineers."))
        self.assertTrue(res_valid["success"])
        skills = res_valid["skills_extracted"]
        self.assertIn("Python", skills)
        self.assertIn("React", skills)
        self.assertIn("Docker", skills)

if __name__ == "__main__":
    unittest.main()
