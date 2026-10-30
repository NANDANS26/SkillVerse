-- Migration: 003_institutions_companies_assignments_and_queue.sql
-- Description: Adds institutions, faculty assignments, companies, indexing queue, and audit logs

-- 1. Indexing Queue (Transactional Outbox for dynamic AI vector synchronization)
CREATE TABLE IF NOT EXISTS indexing_queue (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NULL,
  locked_by VARCHAR(100) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_indexing_queue_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_indexing_queue_status ON indexing_queue (status);
CREATE INDEX IF NOT EXISTS idx_indexing_queue_candidate ON indexing_queue (candidate_id);

-- 2. Institutions (Colleges & Universities)
CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NULL,
  domain VARCHAR(255) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Institution Memberships (Binds college_admin, faculty, student to an institution)
CREATE TABLE IF NOT EXISTS institution_memberships (
  id SERIAL PRIMARY KEY,
  institution_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'college_admin', 'faculty', 'student'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inst_mem_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_inst_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_institution_user UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_inst_mem_institution ON institution_memberships (institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_mem_user ON institution_memberships (user_id);

-- 4. Faculty Student Assignments (Mentorship & Academic Review Roster)
CREATE TABLE IF NOT EXISTS faculty_student_assignments (
  id SERIAL PRIMARY KEY,
  institution_id INT NOT NULL,
  faculty_id INT NOT NULL,
  student_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'transferred'
  notes TEXT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fsa_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_fsa_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fsa_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_faculty_student UNIQUE (faculty_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_fsa_institution ON faculty_student_assignments (institution_id);
CREATE INDEX IF NOT EXISTS idx_fsa_faculty ON faculty_student_assignments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_fsa_student ON faculty_student_assignments (student_id);

-- 5. Companies (Corporate Employers)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Company Memberships (Binds company_admin and recruiter to a company)
CREATE TABLE IF NOT EXISTS company_memberships (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'company_admin', 'recruiter'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comp_mem_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_company_user UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_mem_company ON company_memberships (company_id);
CREATE INDEX IF NOT EXISTS idx_comp_mem_user ON company_memberships (user_id);

-- 7. Add company_id foreign key to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id INT NULL REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs (company_id);

-- 8. Audit Logs (Truthful operational telemetry for administrative oversight)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
