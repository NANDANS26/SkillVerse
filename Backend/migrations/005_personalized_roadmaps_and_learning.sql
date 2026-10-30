-- Migration: 005_personalized_roadmaps_and_learning.sql
-- Description: Student goals, learning activities catalogue, development roadmaps, and prioritized recommendations

-- 1. Student Goals
CREATE TABLE IF NOT EXISTS student_goals (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL DEFAULT 'target_role', -- 'target_role', 'target_job'
  target_title VARCHAR(255) NOT NULL,
  target_job_id INT NULL REFERENCES jobs(id) ON DELETE SET NULL,
  target_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'achieved', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_goals_candidate ON student_goals (candidate_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_status ON student_goals (status);

-- 2. Learning & Practice Activities Catalogue
CREATE TABLE IF NOT EXISTS learning_activities (
  id SERIAL PRIMARY KEY,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'assessment', 'practice_project', 'code_challenge', 'mentorship_review', 'guided_evidence'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'intermediate', -- 'foundational', 'intermediate', 'advanced'
  estimated_minutes INT NOT NULL DEFAULT 60,
  assessment_slug VARCHAR(100) NULL REFERENCES assessments(slug) ON DELETE SET NULL,
  verification_requirement TEXT NOT NULL,
  activity_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_activities_skill ON learning_activities (skill_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON learning_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_activities_assessment ON learning_activities (assessment_slug);

-- 3. Development Roadmaps
CREATE TABLE IF NOT EXISTS development_roadmaps (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  goal_id INT NOT NULL REFERENCES student_goals(id) ON DELETE CASCADE,
  engine_version VARCHAR(64) NOT NULL DEFAULT 'v1.0.0-deterministic-roadmap',
  readiness_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  gap_analysis_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_development_roadmaps_candidate ON development_roadmaps (candidate_id);
CREATE INDEX IF NOT EXISTS idx_development_roadmaps_goal ON development_roadmaps (goal_id);

-- 4. Prioritized Roadmap Recommendations
CREATE TABLE IF NOT EXISTS roadmap_recommendations (
  id SERIAL PRIMARY KEY,
  roadmap_id INT NOT NULL REFERENCES development_roadmaps(id) ON DELETE CASCADE,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id INT NULL REFERENCES skills(id) ON DELETE CASCADE,
  activity_id INT NULL REFERENCES learning_activities(id) ON DELETE SET NULL,
  recommendation_key VARCHAR(150) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'take_assessment', 'retake_assessment', 'request_review', 'practice_project', 'submit_evidence'
  priority INT NOT NULL DEFAULT 3, -- 1: Critical/Development, 2: High/Unassessed with Benchmark, 3: Medium/Pending review, 4: Practice, 5: Evidence submission
  title VARCHAR(255) NOT NULL,
  action_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'in_progress', 'completed', 'dismissed'
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  completion_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_roadmap_rec_key UNIQUE (roadmap_id, recommendation_key)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_recs_roadmap ON roadmap_recommendations (roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_recs_candidate ON roadmap_recommendations (candidate_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_recs_status ON roadmap_recommendations (status);
CREATE INDEX IF NOT EXISTS idx_roadmap_recs_priority ON roadmap_recommendations (priority);

-- 5. Seed Real Learning Activities for Canonical Skills
INSERT INTO learning_activities (skill_id, activity_type, title, description, difficulty, estimated_minutes, assessment_slug, verification_requirement, activity_metadata)
VALUES
  -- Skill 1: Rust
  (
    1,
    'assessment',
    'Rust Systems Engineering Technical Benchmark',
    'Evaluate your understanding of Rust ownership semantics, borrow checker rules, RAII memory safety, and thread concurrency.',
    'intermediate',
    15,
    'rust-systems-foundations',
    'Complete server-graded benchmark assessment with score >= 60%',
    '{"action_url": "/student/assessments/rust-systems-foundations", "provider": "SkillVerse Standardized Benchmark"}'::jsonb
  ),
  (
    1,
    'practice_project',
    'Zero-Copy Lock-Free Ring Buffer in Rust',
    'Implement a thread-safe, lock-free ring buffer for asynchronous packet streaming using crossbeam and atomic memory operations.',
    'advanced',
    120,
    NULL,
    'Submit public GitHub repository with comprehensive unit tests and thread-sanitizer clean execution',
    '{"deliverable": "GitHub repository URL", "rubric": "Concurreny safety, memory layout, benchmarks"}'::jsonb
  ),

  -- Skill 2: Distributed Systems
  (
    2,
    'assessment',
    'Distributed Consensus & Fault Tolerance Technical Benchmark',
    'Test core competencies in Paxos, Raft leader election, CAP theorem trade-offs, vector clocks, and network partition recovery.',
    'intermediate',
    15,
    'distributed-systems-consensus',
    'Complete server-graded benchmark assessment with score >= 60%',
    '{"action_url": "/student/assessments/distributed-systems-consensus", "provider": "SkillVerse Standardized Benchmark"}'::jsonb
  ),
  (
    2,
    'practice_project',
    'Raft Consensus State Machine Implementation',
    'Build a 3-node cluster handling state replication, log compaction, snapshotting, and election timer jitter across network partitions.',
    'advanced',
    180,
    NULL,
    'Submit project proof and request assigned faculty mentor review for formal code verification',
    '{"deliverable": "Repository and simulated cluster test suite"}'::jsonb
  ),

  -- Skill 3: Python
  (
    3,
    'assessment',
    'Python Backend & Async Architecture Technical Benchmark',
    'Benchmark your mastery of asyncio event loops, GIL implications, generators, coroutine dispatching, and type hints.',
    'intermediate',
    15,
    'python-backend-concurrency',
    'Complete server-graded benchmark assessment with score >= 60%',
    '{"action_url": "/student/assessments/python-backend-concurrency", "provider": "SkillVerse Standardized Benchmark"}'::jsonb
  ),
  (
    3,
    'practice_project',
    'Async Event-Driven Streaming Pipeline in Python',
    'Design an asynchronous stream consumer with backpressure handling, dead-letter queuing, and structured logging.',
    'intermediate',
    90,
    NULL,
    'Submit GitHub repository with pytest integration tests and performance benchmarks',
    '{"deliverable": "Async pipeline code with 90%+ test coverage"}'::jsonb
  ),

  -- Skill 4: FastAPI
  (
    4,
    'practice_project',
    'Production-Grade FastAPI Microservice with Dependency Injection',
    'Construct a resilient REST API featuring Pydantic V2 request models, JWT token verification, database connection pooling, and OpenAPI documentation.',
    'intermediate',
    90,
    NULL,
    'Submit repository evidence with automated test runner passing in CI',
    '{"deliverable": "FastAPI service with OpenAPI contract test suite"}'::jsonb
  ),

  -- Skill 5: PostgreSQL
  (
    5,
    'practice_project',
    'Transactional Outbox Pattern & Query Optimization in PostgreSQL',
    'Implement guaranteed at-least-once message delivery using a PostgreSQL outbox table, row-level locking (`FOR UPDATE SKIP LOCKED`), and index optimization.',
    'advanced',
    120,
    NULL,
    'Submit repository with SQL migration scripts and transaction rollback tests',
    '{"deliverable": "PostgreSQL schema, indexes, and outbox worker scripts"}'::jsonb
  ),

  -- Skill 6: React
  (
    6,
    'practice_project',
    'Accessible Design System & State Architecture in React',
    'Develop an enterprise component library with keyboard accessibility (WCAG AA), theme transitions, and optimistic UI updates.',
    'intermediate',
    90,
    NULL,
    'Submit component library repo with Storybook or Vitest component test evidence',
    '{"deliverable": "Accessible React components with full focus trap and ARIA support"}'::jsonb
  ),

  -- Skill 7: Docker
  (
    7,
    'code_challenge',
    'Multi-Stage Distroless Container Hardening',
    'Containerize a multi-service web backend using non-root execution, multi-stage caching, vulnerability scanning (Trivy), and minimal attack surface.',
    'foundational',
    60,
    NULL,
    'Submit Dockerfile with CI vulnerability scan report demonstrating 0 critical vulnerabilities',
    '{"deliverable": "Dockerfile and vulnerability scan report"}'::jsonb
  ),

  -- Skill 8: Kubernetes
  (
    8,
    'practice_project',
    'Zero-Downtime Deployment with Probes & Resource Limits',
    'Author production Kubernetes manifests configuring rolling updates, horizontal pod autoscalers, PodDisruptionBudgets, and liveness/readiness probes.',
    'advanced',
    90,
    NULL,
    'Submit Kubernetes manifest manifests and rolling update verification logs',
    '{"deliverable": "Kubernetes YAML manifests with helm or kustomize structure"}'::jsonb
  ),

  -- Skill 9: Go
  (
    9,
    'practice_project',
    'Concurrent Worker Pool with Context Cancellation in Go',
    'Implement a bounded goroutine worker pool with graceful shutdown, rate limiting, and structured telemetry.',
    'intermediate',
    75,
    NULL,
    'Submit Go repository with race detector (`go test -race`) passing cleanly',
    '{"deliverable": "Go package with race-clean benchmark execution"}'::jsonb
  ),

  -- Skill 10: Application Security
  (
    10,
    'code_challenge',
    'OWASP Top 10 Mitigation & Security Middleware',
    'Implement hardened security middleware for HTTP headers (CSP, HSTS), rate limiting, and token tampering defense.',
    'intermediate',
    60,
    NULL,
    'Submit security test suite demonstrating defense against token forgery and injection attacks',
    '{"deliverable": "Security middleware module with automated penetration tests"}'::jsonb
  )
ON CONFLICT DO NOTHING;
