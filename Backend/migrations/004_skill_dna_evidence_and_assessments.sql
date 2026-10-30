-- Migration: 004_skill_dna_evidence_and_assessments.sql
-- Description: Canonical skill taxonomy, evidence lifecycle, assessment engine, and attempts for SkillVerse Skill DNA

-- 1. Canonical Skill Taxonomy
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Engineering',
  description TEXT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills (slug);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);

-- 2. Technical Skill Assessments Catalogue
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  time_limit_minutes INT NOT NULL DEFAULT 15,
  pass_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.600,
  questions_json JSONB NOT NULL,
  answer_keys_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_slug ON assessments (slug);
CREATE INDEX IF NOT EXISTS idx_assessments_skill ON assessments (skill_id);

-- 3. Candidate Skill Evidence
CREATE TABLE IF NOT EXISTS skill_evidence (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'self_reported', 'resume_extracted', 'project_submission', 'assessment_result', 'faculty_review'
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  source_reference VARCHAR(500) NULL,
  review_status VARCHAR(50) NOT NULL DEFAULT 'unreviewed', -- 'unreviewed', 'pending_review', 'verified', 'rejected', 'withdrawn'
  reviewer_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  review_feedback TEXT NULL,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_candidate ON skill_evidence (candidate_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_skill ON skill_evidence (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_status ON skill_evidence (review_status);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_source ON skill_evidence (source_type);

-- 4. Candidate Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  assessment_id INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  assessment_version INT NOT NULL DEFAULT 1,
  score NUMERIC(4,3) NOT NULL, -- 0.000 to 1.000
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers_submitted JSONB NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_candidate ON assessment_attempts (candidate_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts (assessment_id);

-- 5. Seed Initial Canonical Skills
INSERT INTO skills (slug, name, category, description, aliases) VALUES
  ('rust', 'Rust', 'Systems Programming', 'Memory-safe systems programming without garbage collection, focusing on ownership, borrowing, and concurrency.', '["rustlang", "rust-lang"]'::jsonb),
  ('distributed-systems', 'Distributed Systems', 'Distributed Computing', 'Architecting resilient consensus, partition tolerance, replication models, and Raft/Paxos clusters.', '["distributed-computing", "raft", "paxos"]'::jsonb),
  ('python', 'Python', 'Backend Engineering', 'Dynamic backend development, asyncio concurrency, object-oriented design, and ecosystem packaging.', '["py", "python3"]'::jsonb),
  ('fastapi', 'FastAPI', 'Backend Engineering', 'High-performance ASGI web framework with Pydantic validation, OpenAPI generation, and dependency injection.', '["fast-api", "starlette"]'::jsonb),
  ('postgresql', 'PostgreSQL', 'Database Systems', 'Enterprise relational ACID database management, index tuning, query plan analysis, and MVCC.', '["postgres", "psql"]'::jsonb),
  ('react', 'React', 'Frontend Engineering', 'Component architecture, state reconciliation, virtual DOM lifecycles, hooks, and modern frontend design.', '["reactjs", "react.js"]'::jsonb),
  ('docker', 'Docker', 'Cloud & DevOps', 'Containerization, multi-stage builds, networking boundaries, and immutable artifact deployment.', '["containers", "containerization"]'::jsonb),
  ('kubernetes', 'Kubernetes', 'Cloud & DevOps', 'Container orchestration, declarative manifests, service discovery, ingress management, and cluster scaling.', '["k8s"]'::jsonb),
  ('go', 'Go', 'Systems Programming', 'Statically typed concurrent programming with goroutines, channels, and cloud-native microservices.', '["golang", "go-lang"]'::jsonb),
  ('security', 'Application Security', 'Cybersecurity', 'Cryptographic primitives, authentication threat modeling, OWASP prevention, and token security.', '["appsec", "infosec", "cybersecurity"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  aliases = EXCLUDED.aliases;

-- 6. Seed Technical Assessments with Server-Side Answer Keys
INSERT INTO assessments (slug, title, description, skill_id, version, time_limit_minutes, pass_threshold, questions_json, answer_keys_json)
SELECT 
  'rust-systems-foundations',
  'Rust Systems Engineering Assessment',
  'Evaluates knowledge of Rust ownership semantics, borrow checker rules, zero-cost abstractions, and error propagation.',
  s.id,
  1,
  15,
  0.600,
  '[
    {
      "id": "q1",
      "prompt": "What does the Rust borrow checker prevent at compile time?",
      "choices": {
        "a": "Runtime integer arithmetic overflows",
        "b": "Data races and dangling references across threads without garbage collection",
        "c": "Stack overflow from deep recursive function calls",
        "d": "Memory allocation on the heap"
      }
    },
    {
      "id": "q2",
      "prompt": "Which Rust keyword represents an explicit immutable reference to a value?",
      "choices": {
        "a": "&val",
        "b": "&mut val",
        "c": "*val",
        "d": "ref val"
      }
    },
    {
      "id": "q3",
      "prompt": "How does Rust handle fallible operations idiomatically without throwing exceptions?",
      "choices": {
        "a": "Using try/catch blocks with std::error::Exception",
        "b": "Returning an enum of type Result<T, E> and propagating with the ? operator",
        "c": "Passing an error callback function pointer",
        "d": "Setting a global errno variable"
      }
    },
    {
      "id": "q4",
      "prompt": "What happens when an owner of a heap-allocated resource (e.g. Box<T>) goes out of scope?",
      "choices": {
        "a": "A background garbage collector sweeps it after a fixed interval",
        "b": "Its Drop::drop method is called immediately, deterministic deallocating the resource",
        "c": "The resource persists until program exit",
        "d": "A segmentation fault is raised"
      }
    },
    {
      "id": "q5",
      "prompt": "Which concurrency trait signifies that a type is safe to transfer ownership between threads?",
      "choices": {
        "a": "Sync",
        "b": "Send",
        "c": "Copy",
        "d": "Clone"
      }
    }
  ]'::jsonb,
  '{"q1": "b", "q2": "a", "q3": "b", "q4": "b", "q5": "b"}'::jsonb
FROM skills s WHERE s.slug = 'rust'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  questions_json = EXCLUDED.questions_json,
  answer_keys_json = EXCLUDED.answer_keys_json;

INSERT INTO assessments (slug, title, description, skill_id, version, time_limit_minutes, pass_threshold, questions_json, answer_keys_json)
SELECT 
  'distributed-systems-consensus',
  'Distributed Consensus & Fault Tolerance Assessment',
  'Evaluates understanding of CAP theorem tradeoffs, state machine replication, leader election, and Raft consensus.',
  s.id,
  1,
  15,
  0.600,
  '[
    {
      "id": "q1",
      "prompt": "According to the CAP Theorem, what must a distributed system choose between during a network partition?",
      "choices": {
        "a": "Latency vs Cost",
        "b": "Consistency vs Availability",
        "c": "Throughput vs Security",
        "d": "ACID vs BASE"
      }
    },
    {
      "id": "q2",
      "prompt": "In the Raft consensus protocol, how does a candidate node transition into a cluster leader?",
      "choices": {
        "a": "By receiving votes from a majority (quorum) of cluster nodes in that term",
        "b": "By having the lowest process ID",
        "c": "By having the highest network bandwidth",
        "d": "By manual administrator designation"
      }
    },
    {
      "id": "q3",
      "prompt": "What mechanism does Raft use to detect leader crashes and initiate a new election?",
      "choices": {
        "a": "TCP RST packets sent from the operating system kernel",
        "b": "Randomized heartbeat timeout windows on follower nodes",
        "c": "Synchronized NTP hardware clock timestamps",
        "d": "Centralized database polling"
      }
    },
    {
      "id": "q4",
      "prompt": "What is the primary danger of a split-brain condition in an unpartitioned cluster?",
      "choices": {
        "a": "Nodes consume too much CPU power",
        "b": "Multiple disjoint nodes accept contradictory client writes simultaneously, causing data corruption",
        "c": "DNS cache poisoning",
        "d": "Log files compress too quickly"
      }
    },
    {
      "id": "q5",
      "prompt": "Why are Raft cluster membership sizes typically chosen as odd numbers (e.g. 3, 5, 7)?",
      "choices": {
        "a": "To reduce network cabling requirements",
        "b": "Because odd numbers provide identical fault tolerance to the next even number while requiring fewer nodes for quorum",
        "c": "Because Linux schedulers prioritize odd PID numbers",
        "d": "Because hash rings require prime modulo arithmetic"
      }
    }
  ]'::jsonb,
  '{"q1": "b", "q2": "a", "q3": "b", "q4": "b", "q5": "b"}'::jsonb
FROM skills s WHERE s.slug = 'distributed-systems'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  questions_json = EXCLUDED.questions_json,
  answer_keys_json = EXCLUDED.answer_keys_json;

INSERT INTO assessments (slug, title, description, skill_id, version, time_limit_minutes, pass_threshold, questions_json, answer_keys_json)
SELECT 
  'python-backend-concurrency',
  'Python Backend & Async Architecture Assessment',
  'Evaluates understanding of Python asyncio, event loop lifecycles, generators, and ASGI request processing.',
  s.id,
  1,
  15,
  0.600,
  '[
    {
      "id": "q1",
      "prompt": "How does Python asyncio achieve high-concurrency I/O operations in a single OS thread?",
      "choices": {
        "a": "By preempting CPU instructions at the hardware register level",
        "b": "Using a cooperative single-threaded event loop with non-blocking sockets and coroutines",
        "c": "By spinning up hundreds of background C-threads dynamically",
        "d": "By disabling Python GIL completely"
      }
    },
    {
      "id": "q2",
      "prompt": "What will happen if you run a synchronous, CPU-bound blocking call inside an async def route handler?",
      "choices": {
        "a": "The Python interpreter automatically moves it to another thread",
        "b": "It blocks the entire event loop, delaying all other pending client requests on that worker",
        "c": "An unhandled CoroutineBlockedException is raised immediately",
        "d": "FastAPI spawns a sub-process automatically"
      }
    },
    {
      "id": "q3",
      "prompt": "Which construct should be used to safely run a legacy synchronous blocking I/O function in asyncio?",
      "choices": {
        "a": "asyncio.to_thread() or run_in_executor()",
        "b": "time.sleep()",
        "c": "yield from",
        "d": "asyncio.gather() without await"
      }
    },
    {
      "id": "q4",
      "prompt": "What is the primary difference between a normal Python function and a generator function?",
      "choices": {
        "a": "Generators can only return string data",
        "b": "Generators use yield to produce values lazily while maintaining execution frame state",
        "c": "Generators run in C++ mode",
        "d": "Generators cannot accept parameters"
      }
    },
    {
      "id": "q5",
      "prompt": "What role does Pydantic perform when integrated with FastAPI request handlers?",
      "choices": {
        "a": "Directly compiles Python code to machine assembly",
        "b": "Performs runtime type validation, serialization, and automatic OpenAPI documentation generation",
        "c": "Acts as an in-memory SQL database",
        "d": "Manages TLS certificate renewal"
      }
    }
  ]'::jsonb,
  '{"q1": "b", "q2": "b", "q3": "a", "q4": "b", "q5": "b"}'::jsonb
FROM skills s WHERE s.slug = 'python'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  questions_json = EXCLUDED.questions_json,
  answer_keys_json = EXCLUDED.answer_keys_json;
