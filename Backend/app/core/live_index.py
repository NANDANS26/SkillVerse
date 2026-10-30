# Backend/app/core/live_index.py
import faiss
import numpy as np
import json
import os
import shutil
import threading
from typing import List, Dict, Any, Optional

def resolve_path(path_str: str) -> str:
    if os.path.isabs(path_str) and os.path.exists(path_str):
        return path_str
    if os.path.exists(path_str):
        return os.path.abspath(path_str)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidate = os.path.join(base_dir, path_str)
    return candidate

class LiveCandidateIndex:
    DIMENSION = 384

    def __init__(
        self,
        index_path: str = "models/live_faiss.index",
        meta_path: str = "models/live_meta.json"
    ):
        self.index_path = resolve_path(index_path)
        self.meta_path = resolve_path(meta_path)
        self.bak_index_path = self.index_path + ".bak"
        self.bak_meta_path = self.meta_path + ".bak"
        self.lock = threading.Lock()

        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        self._load_or_create()

    def _load_or_create(self):
        """Loads existing live index or recovers from backup if primary is missing or corrupt."""
        # 1. Try loading primary artifacts
        if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.meta = json.load(f)
                return
            except Exception as e:
                print(f"[LiveIndex] Warning: Primary live index load failed ({e}). Attempting recovery from backup...")

        # 2. Try recovering from backup snapshot (.bak)
        if os.path.exists(self.bak_index_path) and os.path.exists(self.bak_meta_path):
            try:
                print("[LiveIndex] Recovering live candidate index from verified snapshot (.bak)...")
                self.index = faiss.read_index(self.bak_index_path)
                with open(self.bak_meta_path, "r", encoding="utf-8") as f:
                    self.meta = json.load(f)
                # Restore primary files from backup
                shutil.copy2(self.bak_index_path, self.index_path)
                shutil.copy2(self.bak_meta_path, self.meta_path)
                print(f"[LiveIndex] Restored {self.index.ntotal} candidate vectors from backup snapshot.")
                return
            except Exception as e:
                print(f"[LiveIndex] Warning: Backup snapshot recovery failed ({e}).")

        # 3. Fallback: Initialize empty IndexIDMap2(IndexFlatIP)
        sub_index = faiss.IndexFlatIP(self.DIMENSION)
        self.index = faiss.IndexIDMap2(sub_index)
        self.meta = {}

    def save(self):
        """
        Persists FAISS index and metadata to disk atomically with verified snapshot preservation.
        1. Writes to temporary files (.tmp).
        2. Verifies temporary files exist and are readable.
        3. Creates/updates backup snapshot (.bak) from current primary.
        4. Atomically replaces primary files.
        """
        tmp_index = self.index_path + ".tmp"
        tmp_meta = self.meta_path + ".tmp"

        # Step 1: Write to temporary artifacts
        faiss.write_index(self.index, tmp_index)
        with open(tmp_meta, "w", encoding="utf-8") as f:
            json.dump(self.meta, f, indent=2)

        # Step 2: Validate temporary artifacts before activation
        if not (os.path.exists(tmp_index) and os.path.getsize(tmp_index) > 0):
            raise IOError("Temporary FAISS index verification failed (empty or missing file)")
        if not (os.path.exists(tmp_meta) and os.path.getsize(tmp_meta) > 0):
            raise IOError("Temporary metadata verification failed (empty or missing file)")

        # Step 3: Preserve current primary as verified backup snapshot (.bak)
        if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
            try:
                shutil.copy2(self.index_path, self.bak_index_path)
                shutil.copy2(self.meta_path, self.bak_meta_path)
            except Exception as e:
                print(f"[LiveIndex] Note creating backup snapshot: {e}")

        # Step 4: Atomic replacement of primary files
        if os.path.exists(self.index_path):
            os.replace(tmp_index, self.index_path)
        else:
            os.rename(tmp_index, self.index_path)

        if os.path.exists(self.meta_path):
            os.replace(tmp_meta, self.meta_path)
        else:
            os.rename(tmp_meta, self.meta_path)

        # Step 5: Ensure baseline snapshot exists on initial index creation
        if not (os.path.exists(self.bak_index_path) and os.path.exists(self.bak_meta_path)):
            try:
                shutil.copy2(self.index_path, self.bak_index_path)
                shutil.copy2(self.meta_path, self.bak_meta_path)
            except Exception as e:
                print(f"[LiveIndex] Note initializing initial backup snapshot: {e}")

    @property
    def total_candidates(self) -> int:
        return self.index.ntotal

    def upsert_candidate(self, candidate_id: int, vector: np.ndarray, metadata: Dict[str, Any]):
        """
        Idempotently inserts or updates candidate vector and metadata.
        If candidate_id already exists, previous vector is removed first.
        """
        cid = int(candidate_id)
        cid_str = str(cid)

        # Ensure vector shape and normalization
        vec = np.array([vector], dtype="float32")
        if vec.shape[1] != self.DIMENSION:
            raise ValueError(f"Vector dimension {vec.shape[1]} does not match expected {self.DIMENSION}")
        faiss.normalize_L2(vec)

        with self.lock:
            # If already present, remove previous entry to prevent vector accumulation
            if cid_str in self.meta:
                try:
                    self.index.remove_ids(np.array([cid], dtype=np.int64))
                except Exception as e:
                    print(f"[LiveIndex] Note removing existing vector for candidate {cid}: {e}")

            # Add with explicit ID mapped to PostgreSQL candidate_id
            self.index.add_with_ids(vec, np.array([cid], dtype=np.int64))
            
            # Store metadata
            metadata["candidate_id"] = cid
            self.meta[cid_str] = metadata

            self.save()

    def remove_candidate(self, candidate_id: int) -> bool:
        """Removes a candidate by ID from index and metadata."""
        cid = int(candidate_id)
        cid_str = str(cid)

        with self.lock:
            if cid_str not in self.meta:
                return False

            self.index.remove_ids(np.array([cid], dtype=np.int64))
            del self.meta[cid_str]
            self.save()
            return True

    def search(self, vector: np.ndarray, top_k: int = 10) -> List[Dict[str, Any]]:
        """Searches live index and returns resolved metadata and cosine similarity."""
        with self.lock:
            if self.index.ntotal == 0:
                return []

            q = np.array([vector], dtype="float32")
            faiss.normalize_L2(q)

            actual_k = min(top_k, self.index.ntotal)
            if actual_k <= 0:
                return []

            distances, indices = self.index.search(q, actual_k)

            results = []
            for score, cid in zip(distances[0], indices[0]):
                if cid < 0:
                    continue
                cid_str = str(cid)
                if cid_str in self.meta:
                    m = dict(self.meta[cid_str])
                    m["embedding_sim"] = float(score)
                    results.append(m)

            return results

    def rebuild_all(self, records: List[Dict[str, Any]], embedder):
        """Rebuilds live index from a batch of candidate records."""
        with self.lock:
            sub = faiss.IndexFlatIP(self.DIMENSION)
            new_index = faiss.IndexIDMap2(sub)
            new_meta = {}

            if records:
                vectors = []
                ids = []
                for r in records:
                    cid = int(r.get("id") or r.get("candidate_id"))
                    doc = embedder.build_candidate_doc(r)
                    vec = embedder.embed(doc)
                    vectors.append(vec)
                    ids.append(cid)

                    # Extract parsed skills
                    raw_skills = r.get("skill_json") or r.get("skills") or []
                    if isinstance(raw_skills, str):
                        try:
                            skills = json.loads(raw_skills)
                        except:
                            skills = [s.strip() for s in raw_skills.split(",") if s.strip()]
                    else:
                        skills = raw_skills

                    new_meta[str(cid)] = {
                        "candidate_id": cid,
                        "full_name": r.get("full_name", ""),
                        "headline": r.get("headline", ""),
                        "email": r.get("email", ""),
                        "skills": skills,
                        "experience": float(r.get("experience_years", 0.0) or r.get("experience", 0.0) or 0.0),
                        "resume_text": r.get("resume_text", "")
                    }

                v_matrix = np.array(vectors, dtype="float32")
                faiss.normalize_L2(v_matrix)
                id_array = np.array(ids, dtype=np.int64)
                new_index.add_with_ids(v_matrix, id_array)

            self.index = new_index
            self.meta = new_meta
            self.save()
            return len(new_meta)

_live_index_instance: Optional[LiveCandidateIndex] = None

def get_live_index() -> LiveCandidateIndex:
    global _live_index_instance
    if _live_index_instance is None:
        _live_index_instance = LiveCandidateIndex()
    return _live_index_instance
