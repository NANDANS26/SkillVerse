-- Migration: 001_initial_schema.sql
-- Description: Core tables for SkillVerse (users, candidates, jobs, applications, schema_migrations) for PostgreSQL

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  user_id INT NULL,
  full_name VARCHAR(255) NOT NULL,
  headline VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NULL,
  experience_years NUMERIC(4,1) NULL DEFAULT 0.0,
  resume_text TEXT NULL,
  skill_json JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_candidates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_candidates_user ON candidates (user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates (email);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NULL,
  raw_text TEXT NOT NULL,
  parsed_json JSONB NULL,
  experience_min NUMERIC(4,1) NULL DEFAULT 0.0,
  experience_max NUMERIC(4,1) NULL DEFAULT 10.0,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs (recruiter_id);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL,
  candidate_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'applied',
  match_score NUMERIC(5,4) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_apps_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_apps_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT uq_job_candidate UNIQUE (job_id, candidate_id)
);
