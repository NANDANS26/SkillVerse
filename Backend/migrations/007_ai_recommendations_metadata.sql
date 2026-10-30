-- Migration 007: AI Learning Recommendations Metadata & Explainability Vectors
-- Adds support for multi-factor semantic ranking metadata, model versioning, and explanation factors

ALTER TABLE roadmap_recommendations 
  ADD COLUMN IF NOT EXISTS recommendation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_roadmap_recs_metadata 
  ON roadmap_recommendations USING gin (recommendation_metadata);

ALTER TABLE development_roadmaps 
  ADD COLUMN IF NOT EXISTS model_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_development_roadmaps_model_metadata 
  ON development_roadmaps USING gin (model_metadata);
