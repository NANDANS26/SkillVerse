-- Migration: 008_recommendation_feedback_and_outcomes.sql
-- Description: Recommendation impression tracking, authenticated interaction events, and explicit relevance feedback

-- 1. Recommendation Impressions
-- Captures the exact presented recommendations, rank position, and ranking score snapshot
CREATE TABLE IF NOT EXISTS recommendation_impressions (
  id SERIAL PRIMARY KEY,
  presentation_id VARCHAR(64) NOT NULL,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  roadmap_id INT NOT NULL REFERENCES development_roadmaps(id) ON DELETE CASCADE,
  recommendation_id INT NOT NULL REFERENCES roadmap_recommendations(id) ON DELETE CASCADE,
  activity_id INT NULL REFERENCES learning_activities(id) ON DELETE SET NULL,
  rank_position INT NOT NULL CHECK (rank_position >= 1),
  engine_version VARCHAR(64) NOT NULL,
  model_version VARCHAR(64) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
  ranking_score NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  surface VARCHAR(64) NOT NULL DEFAULT 'learning_roadmap',
  presented_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_presentation_rec UNIQUE (presentation_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_impressions_candidate ON recommendation_impressions (candidate_id);
CREATE INDEX IF NOT EXISTS idx_rec_impressions_presentation ON recommendation_impressions (presentation_id);
CREATE INDEX IF NOT EXISTS idx_rec_impressions_rec_id ON recommendation_impressions (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_impressions_presented_at ON recommendation_impressions (presented_at);

-- 2. Recommendation Interaction Events
-- Tracks authenticated student lifecycle actions: opened, started, progress_recorded, completed, dismissed
CREATE TABLE IF NOT EXISTS recommendation_interactions (
  id SERIAL PRIMARY KEY,
  presentation_id VARCHAR(64) NULL,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recommendation_id INT NOT NULL REFERENCES roadmap_recommendations(id) ON DELETE CASCADE,
  activity_id INT NULL REFERENCES learning_activities(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('opened', 'started', 'progress_recorded', 'completed', 'dismissed')),
  engine_version VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  progress_pct INT NULL CHECK (progress_pct >= 0 AND progress_pct <= 100),
  interaction_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_interactions_cand_event ON recommendation_interactions (candidate_id, event_type);
CREATE INDEX IF NOT EXISTS idx_rec_interactions_rec_id ON recommendation_interactions (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_interactions_created_at ON recommendation_interactions (created_at);

-- 3. Explicit Relevance Feedback
-- Captures optional, non-coercive student judgments on curricular relevance and calibration
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id SERIAL PRIMARY KEY,
  presentation_id VARCHAR(64) NULL,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recommendation_id INT NOT NULL REFERENCES roadmap_recommendations(id) ON DELETE CASCADE,
  activity_id INT NULL REFERENCES learning_activities(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reason_category VARCHAR(64) NULL CHECK (
    reason_category IS NULL OR 
    reason_category IN (
      'relevant_to_goal',
      'targets_needed_skill',
      'too_easy',
      'too_difficult',
      'not_related',
      'already_covered'
    )
  ),
  feedback_text VARCHAR(500) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_candidate_rec_feedback UNIQUE (candidate_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_candidate ON recommendation_feedback (candidate_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_rec_id ON recommendation_feedback (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_rating ON recommendation_feedback (rating);
