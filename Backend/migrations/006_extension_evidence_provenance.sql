-- Migration 006: Extension Evidence Provenance & Duplicate Prevention Indexing
-- Enhances query efficiency for candidate repository references and review status

CREATE INDEX IF NOT EXISTS idx_skill_evidence_candidate_source_ref 
  ON skill_evidence (candidate_id, source_reference);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_source_type_status 
  ON skill_evidence (source_type, review_status);
