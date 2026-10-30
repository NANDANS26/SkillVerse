-- Backend/migrations/010_pilot_programs_and_consent.sql
-- SkillVerse Phase 16: Controlled Student Pilot Foundation & Voluntary Participation Schema

-- 1. Pilot Programs Table (Tenant-scoped administrative pilot cohort)
CREATE TABLE IF NOT EXISTS pilot_programs (
  id SERIAL PRIMARY KEY,
  institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  target_engine_version VARCHAR(64) NOT NULL DEFAULT 'v2.0.0-ai-semantic-recommendation',
  target_model_version VARCHAR(64) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
  consent_notice_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  consent_notice_text TEXT NOT NULL,
  created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pilot_status CHECK (status IN ('draft', 'active', 'concluded', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_pilot_programs_inst ON pilot_programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_pilot_programs_status ON pilot_programs(status);

-- 2. Voluntary Student Pilot Enrollments Table
CREATE TABLE IF NOT EXISTS pilot_enrollments (
  id SERIAL PRIMARY KEY,
  pilot_program_id INT NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'enrolled',
  consent_status VARCHAR(32) NOT NULL DEFAULT 'opted_in',
  consent_notice_version VARCHAR(32) NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_pilot_enrollment_cand UNIQUE (pilot_program_id, candidate_id),
  CONSTRAINT chk_enrollment_status CHECK (status IN ('enrolled', 'active', 'withdrawn', 'ineligible')),
  CONSTRAINT chk_consent_status CHECK (consent_status IN ('opted_in', 'withdrawn', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_pilot_enrollments_cand ON pilot_enrollments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_pilot_enrollments_prog ON pilot_enrollments(pilot_program_id);
CREATE INDEX IF NOT EXISTS idx_pilot_enrollments_consent ON pilot_enrollments(consent_status);

-- 3. Pilot Governance Audit Logs Table
CREATE TABLE IF NOT EXISTS pilot_audit_logs (
  id SERIAL PRIMARY KEY,
  pilot_program_id INT REFERENCES pilot_programs(id) ON DELETE SET NULL,
  candidate_id INT REFERENCES candidates(id) ON DELETE SET NULL,
  actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pilot_audit_prog ON pilot_audit_logs(pilot_program_id);
CREATE INDEX IF NOT EXISTS idx_pilot_audit_cand ON pilot_audit_logs(candidate_id);
