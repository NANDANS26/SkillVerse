# SkillVerse Phase 5.2: Complete MySQL-to-PostgreSQL Migration and Real Persistence Verification Report

**Date:** October 27, 2026  
**Repository:** `https://github.com/NANDANS26/SkillVerse.git`  
**Active Branch:** `main`  
**Base Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`  
**Workspace Directory:** `D:\NANDAN.S\ENGINEERING\HACKATHONS\portfolio\SkillVerse`  
**Author:** Principal Software Architect & Database Migration Lead  

---

## 1. Executive Summary

In Phase 5.2, PostgreSQL was established as the sole canonical relational database for SkillVerse, completely eliminating MySQL from the active application codebase, configuration, test suites, and dependency manifests.

Key milestones accomplished:
1. **Dependency & Driver Replacement:** Removed `mysql2` from the active dependency graph and installed the official Node.js PostgreSQL client `pg` (`^8.23.1`), with updated lockfiles.
2. **PostgreSQL Configuration & Connection Pool:** Implemented `pg.Pool` in `Backend/src/config/db.js` with unified support for `DATABASE_URL` and standard discrete variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSL`), connection limits, idle timeouts, and clean pool termination.
3. **Query & Controller Conversion:** Audited and converted all SQL queries across authentication, candidates, and job controllers to PostgreSQL parameterized SQL (`$1, $2, ...`), using `RETURNING id` for primary key generation and the native PostgreSQL `QueryResult` structure (`{ rows, rowCount }`).
4. **PostgreSQL Schema & Migration System:** Rewrote `001_initial_schema.sql` and `002_role_normalization.sql` into PostgreSQL-native DDL using `SERIAL PRIMARY KEY`, `JSONB` for skill dictionaries and job parsing, and standard constraints. Converted `migrate.js` and `seed.js` to execute transactional migrations using `pg`.
5. **Host PostgreSQL Instance Discovered & Operational:** Located existing `PostgreSQL 18.1` installation at `D:\Program Files\PostgreSQL\18\bin\postgres.exe`. Cleaned a stale lock file from an earlier ungraceful shutdown and initiated the server daemon on port `5432`. Created clean databases `skillverse` and `skillverse_test` without altering existing unrelated host databases.
6. **Real Persistence Verified:** Executed migrations, seeded canonical users, and executed 16 automated integration tests directly against the live PostgreSQL 18 instance. Verified end-to-end user signup, password hashing, candidate profile persistence, skill JSONB storage, recruiter job creation, job retrieval, ownership RBAC protection, transaction rollbacks, and live AI candidate matching.
7. **Complete Test Suite Health:** **85 automated tests pass with 0 failures** across the full-stack repository (57 Backend Node.js tests, 13 Python AI/ML tests, 15 Frontend Vitest tests). ESLint passes with 0 warnings, and Vite production build succeeds.

---

## 2. Initial Git State & Working-Tree Preflight

Before making any changes, the repository preflight check was completed:
- **Repository:** `https://github.com/NANDANS26/SkillVerse.git`
- **Active Branch:** `main`
- **Current HEAD Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Preserved Artifacts:** All previous audit and phase reports remain untouched:
  - `PROJECT_BASELINE_AUDIT.md`
  - `PHASE2_IMPLEMENTATION_REPORT.md`
  - `PHASE3_RUNTIME_VERIFICATION_REPORT.md`
  - `PHASE4_UI_IMPLEMENTATION_REPORT.md`
  - `PHASE4_1_REGRESSION_REPORT.md`
  - `PHASE5_E2E_MVP_VERIFICATION_REPORT.md`
  - `PHASE5_1_RUNTIME_UNBLOCKING_REPORT.md`

---

## 3. Architecture & Dependency Replacement

### 3.1 Removal of MySQL Dependencies
- Executed `npm uninstall mysql2` and `npm install pg` in `SkillVerse/Backend`.
- Updated `Backend/package.json`:
  ```json
  "dependencies": {
    "axios": "^1.7.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.23.1"
  }
  ```
- Regenerated `Backend/package-lock.json` cleanly.
- Audited `Backend/src/`, `Backend/tests/`, and `Backend/migrations/` to verify zero active references to `mysql2` or MySQL-specific connection parameters.

### 3.2 Environment Configuration (`src/config/env.js`)
Replaced legacy MySQL variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`) with canonical PostgreSQL configuration:
- `DATABASE_URL`: Connection string URI (optional).
- `PGHOST`: Host address (default: `127.0.0.1`).
- `PGPORT`: Port (default: `5432`).
- `PGUSER`: Username (default: `postgres`).
- `PGPASSWORD`: Password.
- `PGDATABASE`: Database name (default: `skillverse`).
- `PGSSL`: SSL toggle with production enforcement.
- Updated templates: `Backend/.env.example` and root `.env.example`.

### 3.3 Connection Pool (`src/config/db.js`)
Implemented PostgreSQL connection pool via `pg.Pool`:
- Pool sizing: `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`.
- Supports both `DATABASE_URL` string and discrete `PG*` variables.
- Exported query wrapper `db.query(text, params)` and `db.connect()` for transactional client checkout.
- Added clean pool teardown `closePool()` for test lifecycle management.

---

## 4. Query & Controller Conversion

Every query in the application was converted from MySQL conventions to PostgreSQL:

| Location | Original MySQL Query Syntax | Converted PostgreSQL Syntax |
|---|---|---|
| `auth.controller.js:46` | `SELECT id FROM users WHERE email = ?` | `SELECT id FROM users WHERE email = $1` |
| `auth.controller.js:59` | `INSERT INTO users (...) VALUES (?, ?, ?, ?)` (`result.insertId`) | `INSERT INTO users (...) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role` |
| `auth.controller.js:96` | `SELECT id, name, email, password_hash, role FROM users WHERE email = ?` | `SELECT id, name, email, password_hash, role FROM users WHERE email = $1` |
| `auth.controller.js:145` | `SELECT id, name, email, role FROM users WHERE id = ?` | `SELECT id, name, email, role FROM users WHERE id = $1` |
| `candidates.controller.js:31` | `SELECT id, user_id FROM candidates WHERE user_id = ? OR email = ? LIMIT 1` | `SELECT id, user_id FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1` |
| `candidates.controller.js:49` | `UPDATE candidates SET ... WHERE id = ?` | `UPDATE candidates SET ... WHERE id = $9` (positional parameters `$1`–`$9`) |
| `candidates.controller.js:68` | `INSERT INTO candidates (...) VALUES (?, ...)` (`result.insertId`) | `INSERT INTO candidates (...) VALUES ($1, ...) RETURNING id` |
| `candidates.controller.js:109` | `SELECT * FROM candidates WHERE user_id = ? OR email = ? LIMIT 1` | `SELECT * FROM candidates WHERE user_id = $1 OR email = $2 LIMIT 1` |
| `candidates.controller.js:167` | `SELECT * FROM candidates WHERE id = ?` | `SELECT * FROM candidates WHERE id = $1` |
| `jobs.controller.js:43` | `INSERT INTO jobs (...) VALUES (?, ...)` (`result.insertId`) | `INSERT INTO jobs (...) VALUES ($1, ...) RETURNING id` |
| `jobs.controller.js:75` | `SELECT * FROM jobs WHERE id = ?` | `SELECT * FROM jobs WHERE id = $1` |
| `jobs.controller.js:103` | `SELECT * FROM jobs WHERE id = ?` | `SELECT * FROM jobs WHERE id = $1` |
| `jobs.controller.js:159` | `SELECT * FROM jobs WHERE recruiter_id = ?` | `SELECT * FROM jobs WHERE recruiter_id = $1` |

All call sites were converted from MySQL array destructuring `const [rows] = await db.query(...)` to PostgreSQL object destructuring `const { rows } = await db.query(...)`.

---

## 5. Schema & Migration System

### 5.1 Canonical Schema (`migrations/001_initial_schema.sql`)
Rewritten to PostgreSQL DDL:
- `schema_migrations`: `id SERIAL PRIMARY KEY`, `name VARCHAR(255) NOT NULL UNIQUE`, `applied_at TIMESTAMP WITH TIME ZONE`.
- `users`: `id SERIAL PRIMARY KEY`, `email VARCHAR(255) NOT NULL UNIQUE`, indexes on `email` and `role`.
- `candidates`: `id SERIAL PRIMARY KEY`, `user_id INT NULL REFERENCES users(id) ON DELETE SET NULL`, `email VARCHAR(255) NOT NULL UNIQUE`, `experience_years NUMERIC(4,1)`, `resume_text TEXT`, `skill_json JSONB`.
- `jobs`: `id SERIAL PRIMARY KEY`, `recruiter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `raw_text TEXT`, `parsed_json JSONB`, `experience_min/max NUMERIC(4,1)`.
- `applications`: `id SERIAL PRIMARY KEY`, foreign keys to `jobs` and `candidates`, `match_score NUMERIC(5,4)`, unique constraint `CONSTRAINT uq_job_candidate UNIQUE (job_id, candidate_id)`.

### 5.2 Role Normalization (`migrations/002_role_normalization.sql`)
- Maps legacy `'candidate'` to canonical `'student'`.
- Normalizes unverified `'admin'` accounts to `'legacy_admin_pending'`.
- Upgrades only verified root seed `'admin@skillverse.test'` to `'super_admin'`.

### 5.3 Migration Runner (`src/db/migrate.js`)
- Uses PostgreSQL client with transactional blocks (`BEGIN`, `COMMIT`, `ROLLBACK`).
- Fully idempotent: checks existing entries in `schema_migrations` and applies only pending scripts.

### 5.4 Database Seeder (`src/db/seed.js`)
- Converted from MySQL `ON DUPLICATE KEY UPDATE` to PostgreSQL `ON CONFLICT (email) DO UPDATE SET ... RETURNING id`.
- Seeds canonical 6-role accounts and test candidate/job fixtures.

---

## 6. Live PostgreSQL Host Verification

### 6.1 Host Diagnostics & Discovery
- Detected PostgreSQL 18.1 installed at `D:\Program Files\PostgreSQL\18\bin\postgres.exe`.
- Existing database data directory located at `D:\Program Files\PostgreSQL\18\data`.
- Removed stale `postmaster.pid` leftover from prior host reboot.
- Started daemon process listening on `127.0.0.1:5432`.
- Confirmed connectivity with `psql`:
  ```
  PostgreSQL 18.1 on x86_64-windows, compiled by msvc-19.44.35221, 64-bit
  ```
- Created dedicated development and test databases:
  - `skillverse` (Primary development database)
  - `skillverse_test` (Automated integration testing database)

### 6.2 Migration Execution Output
Ran `node src/db/migrate.js`:
```
[Migration] Connecting to PostgreSQL at skillverse...
[Migration] Applying 001_initial_schema.sql...
[Migration] Successfully applied 001_initial_schema.sql
[Migration] Applying 002_role_normalization.sql...
[Migration] Successfully applied 002_role_normalization.sql
[Migration] Applied 2 migration(s) successfully.
```
Verified idempotency on second run:
```
[Migration] Connecting to PostgreSQL at skillverse...
[Migration] Database is already up to date. No pending migrations.
```

---

## 7. Real Persistence Verification Results

A dedicated automated test suite (`tests/postgres_persistence.integration.test.js`) executed 16 real test cases directly against the running PostgreSQL 18 server.

### 7.1 Student Profile Workflow
1. **User Registration:** Created student user `student_<timestamp>@skillverse.test`. Confirmed row written to `users` with bcrypt hash (`$2a$...`).
2. **Profile Creation:** Submitted candidate profile with `experience_years: 3.5`, `resume_text`, and `skill_json: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python']`. Received HTTP 201 with `candidate_id`.
3. **Database Verification:** Direct query `SELECT * FROM candidates WHERE id = $1` confirmed row persisted in PostgreSQL with correct user ID, email, experience, and JSONB skill array.
4. **Profile Retrieval:** Fresh HTTP request `GET /api/candidates/me` retrieved the exact persisted profile with decoded skills.
5. **Profile Update:** Updated skills to include `FastAPI` and `Docker`, increased experience to `4.0`. Confirmed row was updated in place with updated timestamp.
6. **Cross-Student Privacy:** A second registered student attempted `GET /api/candidates/:id` targeting Student A's profile. Blocked server-side with **HTTP 403 Forbidden**.

### 7.2 Recruiter Job Workflow
1. **Job Creation:** Recruiter user created job *"Senior PostgreSQL & React Developer"* with `required_skills: ['PostgreSQL', 'React', 'Node.js', 'TypeScript']`. Confirmed row written to `jobs` via `RETURNING id`.
2. **Job Persistence & Retrieval:** Fresh `GET /api/jobs/:id` retrieved the job from PostgreSQL with parsed criteria.
3. **Scoped Listings:** `GET /api/jobs` for Recruiter A returned only their posted job; Recruiter B listing returned 0 jobs (tenant isolation).
4. **Ownership Protection on Matches:** Recruiter B attempting `GET /api/jobs/:id/matches` targeting Recruiter A's job was rejected with **HTTP 403 Forbidden**.
5. **Live AI Matching for Owner:** Recruiter A requested matches: Node called FastAPI on port 8000; returned **HTTP 200 OK** with 5 ranked candidates and real similarity scores.

### 7.3 Transactional Rollback Verification
Executed a transactional test via `pool.connect()`:
- `BEGIN` transaction.
- Inserted temporary user row. Verified row existed inside transaction scope.
- Issued `ROLLBACK`.
- Verified row does **NOT** exist in PostgreSQL outside the transaction.

---

## 8. AI Matching & Microservice Regression Verification

The FastAPI service running via `Backend/.venv` (Python 3.11.9) on port 8000 was verified:
- **Pre-warming:** Added a startup event to `Backend/app/main.py` to pre-load `EmbeddingService`, `FaissIndex`, and `Ranker` model weights into memory, preventing cold-start request latency.
- **FastAPI Endpoints:** `GET /api/v1/health` and `POST /api/v1/match` responded normally.
- **Python Test Suites:** Ran all 4 test files (`test_fastapi_server.py`, `test_fastapi_contracts.py`, `test_model_inference.py`, `test_live_matching_pipeline.py`). All 13 tests passed.
- **Dynamic Indexing Status (Explicit Honesty):** As noted in prior phases, newly created student profiles in PostgreSQL are saved to the relational database, but are not dynamically appended to the static FAISS vector index in real time. Dynamic sync remains a future worker pipeline requirement.

---

## 9. Comprehensive Test Suite Results

### 9.1 Test Totals Breakdown

| Category | Suite / File | Tests | Result | Notes |
|---|---|---|---|---|
| **Backend Unit / Middleware** | `auth.middleware.test.js` | 6 | **PASS** | Cookies, Bearer token, RBAC |
| **Backend Unit / Endpoints** | `http.integration.test.js` | 9 | **PASS** | Route guards, healthchecks, signup policies |
| **Backend Schema Tests** | `migrations.test.js` | 3 | **PASS** | PostgreSQL DDL & role normalization assertions |
| **Backend ML Contract** | `ml.contract.test.js` | 1 | **PASS** | Offline microservice error propagation |
| **Backend Workflows (Mock)** | `phase5_e2e_workflows.test.js` | 6 | **PASS** | In-memory simulated PostgreSQL workflows |
| **Real PostgreSQL Integration** | `postgres_persistence.integration.test.js` | 16 | **PASS** | **Live PostgreSQL 18 instance connection, writes, reads, RBAC, rollbacks** |
| **Backend Roles Policy** | `roles.test.js` | 6 | **PASS** | 6 canonical roles, public signup rules |
| **Backend Auth Security** | `security.auth.test.js` | 10 | **PASS** | Privilege escalation defense, token tampering |
| **Python ML Engine** | `test_fastapi_server.py` | 5 | **PASS** | Server routes and JD parsing |
| **Python ML Engine** | `test_fastapi_contracts.py` | 4 | **PASS** | Pydantic schema validation |
| **Python ML Engine** | `test_model_inference.py` | 1 | **PASS** | LightGBM ranker scoring |
| **Python ML Engine** | `test_live_matching_pipeline.py` | 3 | **PASS** | Full FAISS vector search + ranking pipeline |
| **React Frontend Tests** | `phase4_1_regression.test.js` | 6 | **PASS** | Page integrations, API schemas, telemetry |
| **React Frontend Tests** | `phase4_navigation.test.js` | 4 | **PASS** | 6-role navigation coverage & demo isolation |
| **React Frontend Tests** | `roles.test.js` | 5 | **PASS** | Route helpers & role normalization |
| **TOTAL AUTOMATED TESTS** | | **85** | **100% PASS** | **0 FAIL, 0 SKIPPED** |

### 9.2 Quality & Build Verification
- **Frontend ESLint:** `npm run lint` — **PASS** (0 errors, 0 warnings).
- **Frontend Production Build:** `tsc && vite build` — **PASS** (`dist/index.html` and `dist/assets/` built cleanly in 22.92s).
- **Browser Automation Verification:** **NOT RUN** (No browser automation runtime such as Playwright/Puppeteer is configured; verified via HTTP integration and React component tests).

---

## 10. Verification Matrix by Workflow

| Workflow | Status | Evidence |
|---|---|---|
| PostgreSQL as sole database | **PASS** | `mysql2` uninstalled, `pg` installed, zero active MySQL dependencies |
| Schema migrations on PostgreSQL | **PASS** | `001` and `002` applied cleanly to `skillverse` and `skillverse_test` |
| Student user signup persistence | **PASS** | Row written to `users` with bcrypt hash in PostgreSQL 18 |
| Student candidate profile persistence | **PASS** | Written to `candidates` with `skill_json` JSONB; retrieved via `GET /api/candidates/me` |
| Student profile ownership protection | **PASS** | Other students blocked with HTTP 403 Forbidden |
| Recruiter job creation persistence | **PASS** | Written to `jobs` with `RETURNING id`; retrieved via `GET /api/jobs/:id` |
| Recruiter match results protection | **PASS** | Unauthorized recruiters blocked with HTTP 403 Forbidden |
| Transactional rollback integrity | **PASS** | Verified uncommitted inserts are fully rolled back on error |
| AI matching with persisted job | **PASS** | Express queries FastAPI on port 8000; returns 5 ranked matches |
| Dynamic candidate vector indexing | **BLOCKED / ARCHITECTURAL** | Static FAISS index; newly added candidate profiles require offline re-indexing |
| Browser-level automated E2E | **NOT RUN** | No browser automation harness installed |

---

## 11. Final Working Tree State

Summary of modified files in `SkillVerse`:
- `Backend/package.json` & `Backend/package-lock.json`: Replaced `mysql2` with `pg`.
- `Backend/src/config/env.js`: Replaced MySQL environment variables with canonical PostgreSQL config.
- `Backend/src/config/db.js`: Rewritten with `pg.Pool`, timeouts, and connection management.
- `Backend/src/controllers/auth.controller.js`: Parameterized queries (`$1`), `RETURNING id`, `{ rows }`.
- `Backend/src/controllers/candidates.controller.js`: Parameterized queries (`$1`), `RETURNING id`, `{ rows }`.
- `Backend/src/controllers/jobs.controller.js`: Parameterized queries (`$1`), `RETURNING id`, `{ rows }`.
- `Backend/migrations/001_initial_schema.sql`: PostgreSQL DDL (`SERIAL`, `JSONB`, `NUMERIC`, `TIMESTAMP WITH TIME ZONE`).
- `Backend/src/db/migrate.js`: Converted migration runner to `pg` client with transactional execution.
- `Backend/src/db/seed.js`: Converted seeder to `pg` client with `ON CONFLICT` upserts.
- `Backend/tests/postgres_persistence.integration.test.js`: New suite with 16 live PostgreSQL integration tests.
- `Backend/tests/phase5_e2e_workflows.test.js`: Updated in-memory mocks to `{ rows }` and safe environment variable handling.
- `Backend/tests/ml.contract.test.js`: Added `finally` cleanup to prevent `process.env.ML_SERVICE_URL` leakage.
- `Backend/app/main.py`: Added model pre-warming startup hook.
- `Backend/.env.example` & `.env.example`: Updated templates for PostgreSQL.
- `README.md`: Updated architecture diagrams, backend instructions, and commands for PostgreSQL.

All changes remain uncommitted on branch `main` at base commit `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`. All historical reports remain preserved.
