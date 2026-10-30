# SKILLVERSE PHASE 5 — DATABASE-BACKED CORE WORKFLOWS, REAL API VERIFICATION, AND END-TO-END MVP VALIDATION REPORT

**Author:** Principal Software Architect & Verification Lead  
**Repository:** `https://github.com/NANDANS26/SkillVerse.git`  
**Base Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`  
**Active Branch:** `main`  
**Execution Date:** October 27, 2026  
**Status:** COMPLETE — Core MVP workflow contracts verified, live database connectivity diagnosed, isolated persistence test suites passing, real LightGBM model inference verified, and comprehensive status breakdown established.

---

## 1. Initial Repository State & Pre-Flight Checks

Before making modifications in Phase 5, the repository environment was inspected:
- **Root Directory:** `D:\NANDAN.S\ENGINEERING\HACKATHONS\portfolio\SkillVerse`
- **Active Branch:** `main`
- **HEAD Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Working Tree State:** All changes from Phase 1, Phase 2, Phase 3, Phase 4, and Phase 4.1 preserved in local working tree.
- **Reports Preserved:**
  - `PROJECT_BASELINE_AUDIT.md` (Phase 1 Baseline Audit)
  - `PHASE2_IMPLEMENTATION_REPORT.md` (Phase 2 Foundation Stabilization)
  - `PHASE3_RUNTIME_VERIFICATION_REPORT.md` (Phase 3 Runtime Verification)
  - `PHASE4_UI_IMPLEMENTATION_REPORT.md` (Phase 4 Six-Role UI Implementation)
  - `PHASE4_1_REGRESSION_REPORT.md` (Phase 4.1 Regression Audit & Recovery)

---

## 2. Files Changed & Implementation Rationale

| File Path | Action | Engineering Rationale |
|---|---|---|
| `Backend/tests/phase5_e2e_workflows.test.js` | Added | End-to-end MVP workflow test suite exercising live connection failure handling, isolated in-memory relational mock persistence (Test A: Student profile, Test B: Recruiter job), ownership defense (403), and matching service status. |
| `PHASE5_E2E_MVP_VERIFICATION_REPORT.md` | Created | Comprehensive root deliverable documenting database state, API contracts, persistence findings, model inference, test totals, and status classifications. |

*Note: All architectural security guards (HttpOnly cookies, JWT verification, RBAC, ownership checks, role normalization) and UI components established in earlier phases were strictly preserved without modification.*

---

## 3. Actual Database State & Migration Analysis

### 3.1 Host & Port Reachability
- **Configured Target:** `localhost:3306` (`env.DB_HOST: env.DB_PORT`)
- **Connection Probing:**
  - PowerShell `Test-NetConnection -ComputerName localhost -Port 3306` &rarr; `TcpTestSucceeded: False`.
  - Python direct TCP socket connect to `127.0.0.1:3306` &rarr; `[WinError 10061] No connection could be made because the target machine actively refused it`.
  - Node.js `mysql2/promise` createConnection &rarr; `ECONNREFUSED 127.0.0.1:3306`.
- **System Service Audit:** `Get-Service -Name *mysql*, *mariadb*, *xampp*, *wamp*` confirmed **no MySQL service exists** on the local Windows operating system. WSL and Docker are not configured or running.
- **Classification:** **BLOCKED (Environmental)** — Local MySQL daemon is not present or running.

### 3.2 Migration Runner & Schema Integrity
- **Migrations Directory:** `Backend/migrations/`
  - `001_initial_schema.sql` (66 lines): Defines `schema_migrations`, `users`, `candidates`, `jobs`, `applications` with InnoDB, UTF8MB4, foreign key constraints, and indexing.
  - `002_role_normalization.sql` (21 lines): Normalizes legacy role values safely; protects against blind privilege escalation (`legacy_admin_pending` review status).
- **Static Syntax & Runner Verification:**
  - Executing `node Backend/src/db/migrate.js` confirms runner connects to `env.DB_HOST:env.DB_PORT/env.DB_NAME`, ensures tracking table `schema_migrations`, and uses transactions per migration file.
  - Due to port 3306 being unreachable, live migration execution against a live MySQL instance cannot proceed.
  - Migration SQL files pass static validation in `Backend/tests/migrations.test.js`.

---

## 4. API Request/Response Contracts Verified

### 4.1 Student Profile Lifecycle
- **Endpoints:**
  - `GET /api/candidates/me` (Protected: `student`, `super_admin`)
  - `POST /api/candidates` (Protected: `student`, `super_admin`)
  - `GET /api/candidates/:id` (Protected: `student`, `recruiter`, `super_admin`)
- **Contract Schema:**
  ```typescript
  interface CandidatePayload {
    full_name: string;        // Required
    email: string;            // Required (validated against req.user.email)
    headline?: string;        // Optional professional title / location
    phone?: string;           // Optional
    experience_years?: number;// Decimal (e.g. 3.5)
    resume_text?: string;     // Text / markdown
    skill_json: string[];     // Array of extracted skill strings
  }
  ```
- **Response Format:**
  - `GET /api/candidates/me` &rarr; `{ success: true, candidate: { id, user_id, full_name, headline, experience_years, skill_json, ... } }` or `{ success: true, candidate: null }`.
  - `POST /api/candidates` &rarr; `201 Created` `{ success: true, message: 'Candidate profile saved successfully', candidate_id: number }`.
- **Ownership & Privacy Defense:**
  - When a student attempts to update a candidate record belonging to another `user_id` &rarr; `403 Forbidden` (`Access denied: Profile belongs to another user`).
  - When a student attempts to access another student's profile via `GET /api/candidates/:id` &rarr; `403 Forbidden` (`Access denied: You do not have permission to view this candidate profile`).

### 4.2 Recruiter Job Creation & Listings
- **Endpoints:**
  - `POST /api/jobs` (Protected: `recruiter`, `super_admin`)
  - `GET /api/jobs` (Protected: `recruiter`, `student`, `super_admin`)
  - `GET /api/jobs/:id` (Protected: `recruiter`, `student`, `super_admin`)
- **Contract Schema:**
  ```typescript
  interface JobPayload {
    title: string;            // Required
    location?: string;        // Default: 'Remote'
    description?: string;     // Required
    raw_text?: string;        // Synonymous with description
    experience_min?: number;  // Default: 0
    experience_max?: number;  // Default: 10
    required_skills?: string[]; // Array of strings (stored in parsed_json.skills)
  }
  ```
- **Response Format:**
  - `POST /api/jobs` &rarr; `201 Created` `{ success: true, message: 'Job created successfully', job_id: number }`.
  - `GET /api/jobs` (Recruiter) &rarr; `200 OK` `{ success: true, jobs: Job[], count: number }` (scoped strictly to `WHERE recruiter_id = ?`).
  - `GET /api/jobs` (Student) &rarr; `200 OK` `{ success: true, jobs: Job[], count: number }` (scoped strictly to `WHERE status = 'open'`).

### 4.3 AI Candidate Matching Contract
- **Endpoint:** `GET /api/jobs/:id/matches` (Protected: `recruiter`, `super_admin`)
- **Requisition Ownership Check:**
  - `if (req.user.role !== 'super_admin' && job.recruiter_id !== req.user.id) return fail(res, 'Access denied: You do not have permission to view matches for this job', 403);`
- **Node-to-FastAPI Communication:**
  - Express dispatches `POST ${env.ML_SERVICE_URL}/api/v1/match` with payload:
    ```json
    {
      "job": {
        "id": 1,
        "title": "Senior Frontend Engineer",
        "required_skills": ["React", "TypeScript"],
        "experience_min": 2,
        "experience_max": 6,
        "exp_min": 2,
        "exp_max": 6,
        "raw_text": "Job description text"
      },
      "top_k": 10
    }
    ```
- **Error Disambiguation:**
  - **Service Offline / Unreachable:** Returns `HTTP 503 Service Unavailable` with message:  
    `"AI Matching Service is currently unavailable. Please verify the Python AI microservice is running."`
  - **Genuine Zero Matches:** Returns `HTTP 200 OK` `{ success: true, job_id: 1, matches: [], results: [], count: 0 }`.
  - **Successful Inference:** Returns `HTTP 200 OK` with candidate rankings containing `candidate_id`, `match_score`, `skill_overlap`, `embedding_sim`, `matchedSkills`, and `evidence`.

---

## 5. Authentication, Authorization & Session Integrity

1. **HttpOnly Cookie Architecture:**
   - Tokens are issued inside HttpOnly cookies (`Set-Cookie: token=...; HttpOnly; SameSite=Lax`).
   - Client scripts cannot access the raw JWT via `document.cookie`.
   - `Frontend/src/services/api.ts` passes `credentials: 'include'` on all network requests.
2. **Session Persistence:**
   - On page reload, the client requests `GET /api/auth/me`.
   - The server validates the cookie token, extracts `req.user`, and returns `{ success: true, user: { id, email, name, role } }`.
3. **Session Invalidation:**
   - `POST /api/auth/logout` sets an expired cookie (`token=; Max-Age=0; Path=/; HttpOnly`), immediately terminating the session.
4. **Privilege Escalation Defense:**
   - Public registration (`POST /api/auth/signup`) explicitly rejects `super_admin`, `admin`, `college_admin`, `faculty`, and `company_admin` with `403 Forbidden`. Only `student` and `recruiter` accounts can be self-registered.

---

## 6. End-to-End Persistence Validation Results

### 6.1 Live Database Execution (Honest Propagation)
- **Observed Behavior:**
  - When live database queries are executed (`getMyCandidateProfile`, `createCandidate`, `createJob`), `mysql2` raises `ECONNREFUSED 127.0.0.1:3306`.
  - Controllers intercept this error and respond with `HTTP 500` `{ success: false, message: 'Failed to fetch candidate profile: connect ECONNREFUSED...' }`.
  - The Express process does NOT crash; error handlers catch and log the failure cleanly.
  - The frontend surfaces this error to the user without fabricating success.
- **Classification:** **PASS (Defensive Error Handling Verified)**

### 6.2 Isolated Relational Mock Suite (Test A & Test B)
To verify the complete business logic and authorization constraints without a live MySQL instance, an isolated in-memory query mock was executed in `Backend/tests/phase5_e2e_workflows.test.js`:

#### Test A — Student Profile Persistence:
1. Student 1 queries profile &rarr; returns `candidate: null`.
2. Student 1 submits `{ full_name: 'Maya Lin', headline: 'Distributed Systems & Cloud Engineer', experience_years: 3.5, skill_json: ['Go', 'Distributed Systems', 'Kubernetes', 'FastAPI'] }` &rarr; `201 Created` with `candidate_id: 101`.
3. Student 1 retrieves profile again &rarr; returns persisted fields with matching data.
4. Student 2 attempts to overwrite Maya's profile by spoofing email &rarr; **`403 Forbidden`**.
5. Student 2 attempts direct query of Maya's profile by ID &rarr; **`403 Forbidden`**.
- **Classification:** **PASS (Isolated Business Logic & Security Verified)**

#### Test B — Recruiter Job Persistence:
1. Recruiter 1 creates job `'Senior ML Infrastructure Engineer'` &rarr; `201 Created` with `job_id: 501`.
2. Recruiter 1 lists jobs &rarr; returns 1 job with parsed skills `['Python', 'FastAPI', 'FAISS', 'Kubernetes']`.
3. Recruiter 2 lists jobs &rarr; returns 0 jobs (filtered to recruiter's own requisitions).
4. Recruiter 2 attempts to access matches for Job 501 &rarr; **`403 Forbidden`**.
- **Classification:** **PASS (Isolated Business Logic & Ownership Verified)**

---

## 7. Python FastAPI Matching Service & Real Inference Status

### 7.1 Microservice Operational Check
- **FastAPI Core (`Backend/app/main.py`):**
  - Starts cleanly and handles requests.
  - `GET /` &rarr; `200 OK` `{"status": "ok", "service": "SkillVerse AI Intelligence Backend", "version": "1.0.0"}`.
  - `GET /api/v1/health` &rarr; `200 OK` `{"status": "ok", "message": "ML service running"}`.
  - `POST /api/v1/parse_jd` &rarr; `200 OK` `{"success": true, "skills_extracted": [...], "clean_text": "..."}`.
  - All verified via FastAPI `TestClient` in `Backend/tests/test_fastapi_server.py`.
- **Classification:** **PASS**

### 7.2 Model Artifacts & Real Inference Status
- **Artifact Availability (`Backend/models/`):**
  - `models/ranker.pkl` (619 KB): LightGBM ranking model artifact &rarr; **Present**.
  - `models/faiss.index` (7.68 MB): Candidate vector index &rarr; **Present**.
  - `models/meta.json` (7.13 MB): Candidate metadata mapping &rarr; **Present**.
  - `models/features.csv` (119 KB): Feature schema definitions &rarr; **Present**.
- **Real Model Inference Test (`Backend/tests/test_model_inference.py`):**
  - Loads `models/ranker.pkl` using `Ranker` class.
  - Evaluates candidate vectors against trained LightGBM model:
    - High-match candidate (`embedding_sim: 0.90, skill_overlap: 0.85, exp_match: 1.0`) &rarr; **Score: 0.9970**.
    - Low-match candidate (`embedding_sim: 0.20, skill_overlap: 0.0, exp_match: 0.0`) &rarr; **Score: 0.0000**.
  - **Result:** Real model inference runs and discriminates high vs low candidates cleanly.
- **Classification:** **PASS (Real LightGBM Inference Verified)**

### 7.3 End-to-End FAISS Vector Search Status
- **Missing Dependency:** In the global Windows Python environment, `sentence_transformers` and `faiss-cpu` are not installed.
- **Observed Behavior:**
  - Calling `POST /api/v1/match` returns `500 Internal Server Error` with detail:  
    `"AI model loading failed: No module named 'sentence_transformers'"`.
  - Node.js catches this error and surfaces `HTTP 503 Service Unavailable` to the recruiter UI.
  - Frontend renders clear actionable guidance: `AI Matching Microservice Unavailable (HTTP 503)`.
- **Classification:** **BLOCKED (Python Environment Missing sentence-transformers and faiss-cpu)**

---

## 8. Browser-Level Validation Status

- **Status:** **NOT RUN**
- **Technical Rationale:** The current host development environment does not have a browser automation harness (such as Playwright, Puppeteer, or an active Chrome DevTools automation session).
- **Static Code Verification:**
  - `Frontend/src/services/api.ts` correctly passes `credentials: 'include'` for all requests.
  - `ProtectedRoute.tsx` verifies `user` and `role` before rendering protected routes.
  - Role switcher in `Topbar.tsx` is strictly restricted to `isDemoMode === true`.
  - All 13 inner pages have been deduplicated (no inner `<Sidebar />` components).
  - Responsive layouts use Tailwind breakpoints (`sm:`, `md:`, `lg:`) supporting viewports 375px through 1440px.

---

## 9. Comprehensive Automated Test Totals & Build Results

### 9.1 Backend Test Suites
```bash
> cd Backend && npm test
ℹ tests 40 | suites 12 | pass 40 | fail 0
```
- Auth Middleware & Cookie Parsing (6 tests) &rarr; **PASS**
- Live HTTP API Endpoint & Middleware Integration (9 tests) &rarr; **PASS**
- Database Schema & Migrations Suite (3 tests) &rarr; **PASS**
- AI/ML Service Contract & Error Propagation (1 test) &rarr; **PASS**
- Canonical Role Model & Security Policies (6 tests) &rarr; **PASS**
- Privilege Escalation Defense Suite (7 tests) &rarr; **PASS**
- Token Tampering & Expired Session Defense (3 tests) &rarr; **PASS**
- Phase 5: Real Workflow Validation & Persistence Security Suite (5 tests) &rarr; **PASS**

### 9.2 Python Microservice Tests
```bash
> python tests/test_fastapi_server.py       # 5 tests -> PASS
> python tests/test_fastapi_contracts.py    # 4 tests -> PASS
> python tests/test_model_inference.py      # 1 test  -> PASS (Score: 0.9970 vs 0.0000)
Total Python Tests: 10 passed across 3 test runners
```

### 9.3 Frontend Test Suites
```bash
> cd Frontend && npm test
ℹ tests 15 | suites 3 | pass 15 | fail 0
```
- Phase 4.1 Regression Suite (6 tests) &rarr; **PASS**
- Navigation & Demo Isolation (4 tests) &rarr; **PASS**
- Role Normalization & Route Helpers (5 tests) &rarr; **PASS**

### 9.4 Linting & TypeScript Build
- **ESLint:** `cd Frontend && npm run lint` &rarr; **0 errors, 0 warnings**.
- **Production Build:** `cd Frontend && npm run build` &rarr; **Built in 20.40s (exit code 0)**.

---

## 10. Summary Classification Table (PASS / FAIL / BLOCKED / NOT RUN)

| Workflow / Capability | Verification Method | Status | Notes |
|---|---|---|---|
| **Node.js Express Server Startup** | HTTP test & `supertest` | **PASS** | Serves routes, parses cookies, handles 404/500 cleanly. |
| **Authentication & Cookie Handling** | Automated integration tests | **PASS** | HttpOnly cookie session, logout cookie invalidation verified. |
| **RBAC & Privilege Escalation Defense** | Automated security suite | **PASS** | Rejects unprivileged role registrations; blocks student from recruiter endpoints. |
| **Student Profile Persistence (Logic)** | Isolated in-memory DB mock | **PASS** | Upsert on `user_id`/`email`, profile retrieval, ownership check (403) verified. |
| **Recruiter Job Creation & Listing (Logic)**| Isolated in-memory DB mock | **PASS** | Requisition creation, recruiter-scoped listing, ownership check (403) verified. |
| **Live Database Connectivity (MySQL)** | TCP & `mysql2` socket test | **BLOCKED** | Port 3306 unreachable; no local MySQL service installed on host. |
| **Live Migrations Execution** | `migrate.js` CLI execution | **BLOCKED** | Blocked by absence of reachable MySQL server. SQL syntax verified. |
| **FastAPI Core Endpoints** | FastAPI `TestClient` | **PASS** | `GET /` (200), `GET /api/v1/health` (200), `POST /api/v1/parse_jd` (200) verified. |
| **Real LightGBM Model Inference** | `test_model_inference.py` | **PASS** | Real inference on `models/ranker.pkl` succeeds (Score: 0.9970 vs 0.0000). |
| **End-to-End FAISS Vector Search** | FastAPI `/api/v1/match` | **BLOCKED** | Missing `sentence-transformers` and `faiss-cpu` in global Python environment. |
| **Matching Error Propagation** | Express controller test | **PASS** | Express catches ML error and returns honest HTTP 503 without fake scores. |
| **Browser-Level UI Automation** | Headless browser execution | **NOT RUN** | No browser automation framework (Playwright/Puppeteer) available on host. |
| **Frontend Production Build & Lint** | `tsc && vite build`, `eslint` | **PASS** | 0 ESLint warnings, 0 TypeScript errors, clean production bundle. |

---

## 11. Remaining Limitations & Recommendations for Phase 6

1. **MySQL Service Provisioning:**
   - To exercise live persistence against physical storage, provision a local MySQL 8.0 server or configure connection parameters to a dedicated cloud database instance in `.env`.
   - Run `node Backend/src/db/migrate.js` to execute migrations `001_initial_schema.sql` and `002_role_normalization.sql`.
2. **Python Environment Setup for Full Vector Search:**
   - Install the declared ML dependencies (`pip install sentence-transformers faiss-cpu`) in a dedicated Python virtual environment to allow `app.core.embeddings` and `app.core.faiss_index` to perform live embedding generation and vector search.
3. **Browser Automation:**
   - Install Playwright in `Frontend` (`npm install -D @playwright/test`) to enable automated end-to-end browser walkthroughs across all viewport sizes (375px to 1440px).

---

## 12. Final Working-Tree Summary

All modifications remain local, uncommitted, and fully preserved on branch `main`:
- 40 passing backend tests across 12 suites.
- 15 passing frontend tests across 3 suites.
- 10 passing python unit tests.
- 0 ESLint errors and 0 warnings.
- Clean Vite production build.
- All 6 reports preserved at project root.
