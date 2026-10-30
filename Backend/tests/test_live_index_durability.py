# Backend/tests/test_live_index_durability.py
import unittest
import os
import shutil
import tempfile
import numpy as np
import threading
from app.core.live_index import LiveCandidateIndex

class TestLiveIndexDurabilityAndRecovery(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="live_index_test_")
        self.index_path = os.path.join(self.test_dir, "test_live.index")
        self.meta_path = os.path.join(self.test_dir, "test_meta.json")

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_successful_upsert_and_persistence_reload(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        vec1 = np.random.randn(384).astype("float32")
        meta1 = {"full_name": "Test Candidate 1", "skills": ["Python", "FastAPI"]}

        live_idx.upsert_candidate(101, vec1, meta1)
        self.assertEqual(live_idx.total_candidates, 1)

        # Reopen from disk (simulates process restart)
        reloaded = LiveCandidateIndex(self.index_path, self.meta_path)
        self.assertEqual(reloaded.total_candidates, 1)
        self.assertIn("101", reloaded.meta)
        self.assertEqual(reloaded.meta["101"]["full_name"], "Test Candidate 1")

    def test_dimension_mismatch_rejected(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        bad_vec = np.random.randn(128).astype("float32") # Not 384
        with self.assertRaises(ValueError):
            live_idx.upsert_candidate(102, bad_vec, {"skills": ["C++"]})

    def test_idempotent_candidate_update(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        vec_v1 = np.random.randn(384).astype("float32")
        live_idx.upsert_candidate(201, vec_v1, {"skills": ["Java"]})
        self.assertEqual(live_idx.total_candidates, 1)

        # Update candidate 201 with different vector and skills
        vec_v2 = np.random.randn(384).astype("float32")
        live_idx.upsert_candidate(201, vec_v2, {"skills": ["Java", "Spring Boot"]})
        self.assertEqual(live_idx.total_candidates, 1, "Must not accumulate duplicate vectors for same candidate")
        self.assertEqual(live_idx.meta["201"]["skills"], ["Java", "Spring Boot"])

    def test_unknown_candidate_removal(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        self.assertFalse(live_idx.remove_candidate(9999))

    def test_recovery_from_corrupt_primary_using_backup_snapshot(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        vec = np.random.randn(384).astype("float32")
        live_idx.upsert_candidate(301, vec, {"full_name": "Snapshot Candidate"})
        
        # Verify backup snapshot was created
        bak_index = self.index_path + ".bak"
        bak_meta = self.meta_path + ".bak"
        self.assertTrue(os.path.exists(bak_index))
        self.assertTrue(os.path.exists(bak_meta))

        # Intentionally corrupt primary index file
        with open(self.index_path, "wb") as f:
            f.write(b"CORRUPT_GARBAGE_BYTES_123456789")

        # Reopen index - must recover automatically from backup snapshot
        recovered = LiveCandidateIndex(self.index_path, self.meta_path)
        self.assertEqual(recovered.total_candidates, 1)
        self.assertIn("301", recovered.meta)
        self.assertEqual(recovered.meta["301"]["full_name"], "Snapshot Candidate")

    def test_concurrent_candidate_indexing_thread_safety(self):
        live_idx = LiveCandidateIndex(self.index_path, self.meta_path)
        threads = []

        def worker(cid):
            vec = np.random.randn(384).astype("float32")
            live_idx.upsert_candidate(cid, vec, {"candidate_id": cid, "skills": [f"Skill_{cid}"]})

        for i in range(10):
            t = threading.Thread(target=worker, args=(500 + i,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        self.assertEqual(live_idx.total_candidates, 10)
        self.assertEqual(len(live_idx.meta), 10)

if __name__ == "__main__":
    unittest.main()
