-- Migration: 009_telemetry_provenance_and_data_sources.sql
-- Description: Adds provenance_tag to recommendation telemetry to isolate automated test fixtures from genuine pilot observations

-- 1. Add provenance_tag to recommendation_impressions
ALTER TABLE recommendation_impressions 
  ADD COLUMN IF NOT EXISTS provenance_tag VARCHAR(32) NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_rec_impressions_provenance ON recommendation_impressions (provenance_tag);

-- 2. Add provenance_tag to recommendation_interactions
ALTER TABLE recommendation_interactions 
  ADD COLUMN IF NOT EXISTS provenance_tag VARCHAR(32) NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_rec_interactions_provenance ON recommendation_interactions (provenance_tag);

-- 3. Add provenance_tag to recommendation_feedback
ALTER TABLE recommendation_feedback 
  ADD COLUMN IF NOT EXISTS provenance_tag VARCHAR(32) NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_rec_feedback_provenance ON recommendation_feedback (provenance_tag);

-- 4. Retrospective provenance classification for existing records grounded in conclusive evidence
-- 4.1 Classify automated test fixtures based on user email patterns
UPDATE recommendation_impressions ri
SET provenance_tag = 'automated_test'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE ri.candidate_id = c.id
  AND (
    u.email LIKE '%@skillverse.test' 
    OR u.email LIKE 'phase14_%' 
    OR u.email LIKE 'stu_apex_%' 
    OR u.email LIKE 'audit_stu_%' 
    OR u.email LIKE 'stu_norm_%'
    OR u.email LIKE 'sa_p15_%'
  )
  AND u.email != 'student@skillverse.test';

UPDATE recommendation_interactions rx
SET provenance_tag = 'automated_test'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE rx.candidate_id = c.id
  AND (
    u.email LIKE '%@skillverse.test' 
    OR u.email LIKE 'phase14_%' 
    OR u.email LIKE 'stu_apex_%' 
    OR u.email LIKE 'audit_stu_%' 
    OR u.email LIKE 'stu_norm_%'
    OR u.email LIKE 'sa_p15_%'
  )
  AND u.email != 'student@skillverse.test';

UPDATE recommendation_feedback rf
SET provenance_tag = 'automated_test'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE rf.candidate_id = c.id
  AND (
    u.email LIKE '%@skillverse.test' 
    OR u.email LIKE 'phase14_%' 
    OR u.email LIKE 'stu_apex_%' 
    OR u.email LIKE 'audit_stu_%' 
    OR u.email LIKE 'stu_norm_%'
    OR u.email LIKE 'sa_p15_%'
  )
  AND u.email != 'student@skillverse.test';

-- 4.2 Classify canonical demo user (student@skillverse.test / Maya Lin)
UPDATE recommendation_impressions ri
SET provenance_tag = 'demo_fixture'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE ri.candidate_id = c.id
  AND u.email = 'student@skillverse.test';

UPDATE recommendation_interactions rx
SET provenance_tag = 'demo_fixture'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE rx.candidate_id = c.id
  AND u.email = 'student@skillverse.test';

UPDATE recommendation_feedback rf
SET provenance_tag = 'demo_fixture'
FROM candidates c
JOIN users u ON c.user_id = u.id
WHERE rf.candidate_id = c.id
  AND u.email = 'student@skillverse.test';
