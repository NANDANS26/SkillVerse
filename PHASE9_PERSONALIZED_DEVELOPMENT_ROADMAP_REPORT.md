# SkillVerse Phase 9 Delivery Report: Personalized Skill Gap Analysis, Learning Recommendations, and Development Roadmaps

**Date:** October 27, 2026  
**Repository:** `https://github.com/NANDANS26/SkillVerse.git`  
**Branch:** `main`  
**Base Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`  
**Engine Identifier:** `v1.0.0-deterministic-roadmap`  
**Database:** PostgreSQL 18.1 (Sole Relational Store)  
**Total Automated Tests:** 194 Passing Tests (0 Failures, 0 Skips)

---

## 1. Initial Branch, Commit, and Working-Tree Status

Prior to initiating Phase 9 implementation, repository status was verified:
- **Active Branch:** `main`
- **HEAD Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7` ("SkillVerse Phase 4 Delivery")
- **Preserved Uncommitted Historical Reports:**
  - `PROJECT_BASELINE_AUDIT.md`
  - `PHASE2_IMPLEMENTATION_REPORT.md`
  - `PHASE3_RUNTIME_VERIFICATION_REPORT.md`
  - `PHASE4_UI_IMPLEMENTATION_REPORT.md`
  - `PHASE4_1_REGRESSION_REPORT.md`
  - `PHASE5_1_RUNTIME_UNBLOCKING_REPORT.md`
  - `PHASE5_2_POSTGRESQL_MIGRATION_REPORT.md`
  - `PHASE5_3_DYNAMIC_CANDIDATE_INDEXING_REPORT.md`
  - `PHASE5_E2E_MVP_VERIFICATION_REPORT.md`
  - `PHASE6_MVP_OPERATIONALIZATION_AND_E2E_DELIVERY_REPORT.md`
  - `PHASE6_1_INDEPENDENT_VERIFICATION_REPORT.md`
  - `PHASE7_SIX_ROLE_PRODUCT_WORKFLOWS_REPORT.md`
  - `PHASE7_1_FINAL_OPERATIONAL_VERIFICATION_REPORT.md`
  - `PHASE8_SKILL_DNA_ENGINE_REPORT.md`
  - `PHASE8_1_SKILL_DNA_VALIDATION_REPORT.md`
- **Preserved Model Artifacts:**
  - `Backend/models/faiss.index` (Untouched static baseline)
  - `Backend/models/meta.json` (Untouched baseline metadata)
  - `Backend/models/ranker.pkl` (Untouched LightGBM ranker)
  - `Backend/models/features.csv` (Untouched feature contract)
  - `Backend/models/live_faiss.index` & `.bak` (Active dynamic candidate vector store)
  - `Backend/models/live_meta.json` & `.bak` (Active dynamic candidate metadata)

---

## 2. Existing Schema and Capability Gaps Discovered

An architectural audit of the Phase 8.1 state identified the following shortcomings:
1. **Frontend Disconnection:** `Frontend/src/pages/candidate/CandidateLearning.tsx` presented hardcoded static courses with mock progress bars completely decoupled from candidate profiles, Skill DNA evidence, and actual recruiter jobs.
2. **Missing Career Goal Model:** No PostgreSQL schema existed to store candidate career aspirations, target roles, or target job requisitions.
3. **Absence of Diagnostic Gap Intelligence:** The platform could compute Skill DNA scores via `v1.1.0-deterministic-heuristic`, but could not compare candidate competency against target profiles to produce explainable gap states.
4. **Lack of Learning Activity Schema:** No structured catalogue existed for in-platform benchmark tests, guided practice projects, or algorithm challenges linked to canonical skill slugs.
5. **No Trackable Recommendation Engine:** No persistent snapshot existed to track actionable learning tasks, priority ordering, or progression lifecycles (`active`, `in_progress`, `completed`, `dismissed`).

---

## 3. New or Modified Migrations

### Migration `Backend/migrations/005_personalized_roadmaps_and_learning.sql`
A transactional migration was authored and executed against PostgreSQL, adding four relational structures:
1. `student_goals`:
   - Records student career objectives (`goal_type`: `'career_role'` or `'target_job'`).
   - Links to `target_role_slug` or foreign key `target_job_id` references `jobs(id)`.
   - Stores `target_skills` array and `is_active` boolean with strict student-level constraints.
2. `learning_activities`:
   - Curated in-platform educational repository keyed by `skill_id`.
   - Supports activity types: `assessment_benchmark`, `practice_project`, `code_challenge`, and `curated_resource`.
   - Pre-seeded with 13 concrete activities spanning all 10 canonical skills.
3. `development_roadmaps`:
   - Authoritative snapshot table recording `student_id`, `goal_id`, `engine_version` (`v1.0.0-deterministic-roadmap`), `readiness_score` ($0.0 - 100.0$), `gap_analysis_json`, and `summary_json`.
4. `roadmap_recommendations`:
   - Normalized recommendation tasks linked to `roadmap_id` and optional `activity_id` / `skill_id`.
   - Unique constraint `UNIQUE(roadmap_id, recommendation_key)` ensuring strict idempotency.
   - Enforces valid status transitions: `'active'`, `'in_progress'`, `'completed'`, `'dismissed'`.

Migration registration was verified in `schema_migrations`:
```sql
SELECT version FROM schema_migrations ORDER BY version;
-- 001_initial_schema.sql
-- 002_role_normalization.sql
-- 003_institutions_companies_assignments_and_queue.sql
-- 004_canonical_skill_dna_and_assessments.sql
-- 005_personalized_roadmaps_and_learning.sql
```

---

## 4. Significant Backend, Service, and Frontend Files Changed

### Backend Additions & Updates
- `Backend/src/services/roadmap.service.js` (NEW):
  - Implements deterministic roadmap engine `v1.0.0-deterministic-roadmap`.
  - Defines 4 canonical career presets: `distributed_systems_engineer`, `backend_platform_architect`, `systems_software_engineer`, `fullstack_web_architect`.
  - Implements `getStudentGoal`, `setStudentGoal`, `analyzeSkillGaps`, `generateDevelopmentRoadmap`, `updateRecommendationStatus`, and `getLearningActivitiesCatalogue`.
- `Backend/src/controllers/roadmap.controller.js` (NEW):
  - Express controller handling HTTP endpoints with parameter sanitization, error propagation, and role authorization.
- `Backend/src/routes/roadmap.routes.js` (NEW):
  - Routes mounted under `/api/student`:
    - `GET /api/student/goal`: Retrieves active goal, roadmap, and gap diagnostic summary.
    - `POST /api/student/goal`: Creates or updates active career role or target job goal.
    - `GET /api/student/roadmap`: Retrieves current development roadmap and recommendations.
    - `POST /api/student/roadmap/regenerate`: Idempotently refreshes roadmap and recommendations.
    - `PATCH /api/student/roadmap/recommendations/:id`: Updates recommendation lifecycle status.
    - `GET /api/student/learning/activities`: Lists in-platform practice catalogue with optional skill filter.
- `Backend/server.js`:
  - Mounted `roadmapRoutes` at `/api/student`.
- `Backend/tests/phase9_personalized_roadmaps.test.js` (NEW):
  - 13 comprehensive end-to-end integration tests validating all Phase 9 contracts.
- `Backend/tests/migrations.test.js`:
  - Updated to assert presence and validity of migration `005_personalized_roadmaps_and_learning.sql`.

### Frontend Additions & Updates
- `Frontend/src/pages/candidate/CandidateLearning.tsx` (OVERHAULED):
  - Replaced legacy static mocks with dynamic PostgreSQL-backed roadmap UI.
  - Interactive Goal Selection modal toggling between predefined career profiles and active platform recruiter jobs.
  - Real-time KPI summary: Target Goal, Readiness %, Evidence Supported, Development Indicated, Unassessed Opportunities.
  - Target Skill Gap Matrix displaying all 6 canonical diagnostic states with confidence and proficiency bars.
  - Prioritized Action Plan with filterable recommendation cards and status update controls (`Start Activity`, `Mark Complete`, `Dismiss`).
  - Actionable CTAs linking directly to platform assessments (`/candidate/assessments`) or project submission drawers.
  - Academic integrity banner explicitly notifying students that completing recommendation tasks tracks personal study progress without falsifying Skill DNA scores.

---

## 5. The Goal-Selection Model

Students can anchor their skill gap analysis to two distinct goal types:

### A. Predefined Career Role Presets
Curated industry profiles specifying required canonical skill slugs and minimum benchmark proficiencies:
1. **Distributed Systems Engineer:**
   - Skills: `distributed-systems` (min 70%), `database-query-optimization` (min 70%), `api-security` (min 70%), `concurrency-control` (min 60%), `docker` (min 60%).
2. **Backend Platform Architect:**
   - Skills: `backend-architecture` (min 75%), `database-query-optimization` (min 75%), `api-security` (min 70%), `cloud-native` (min 65%), `restful-api-design` (min 70%).
3. **Systems Software Engineer:**
   - Skills: `concurrency-control` (min 75%), `memory-management` (min 75%), `distributed-systems` (min 65%), `database-query-optimization` (min 65%).
4. **Fullstack Web Architect:**
   - Skills: `restful-api-design` (min 75%), `backend-architecture` (min 70%), `database-query-optimization` (min 65%), `api-security` (min 70%), `docker` (min 60%).

### B. Persisted Recruiter Jobs
Students can select any active job requisition posted by a recruiter on SkillVerse. The engine parses `jobs.parsed_json` or extracts skills dynamically from the job description, mapping requirements directly against the candidate's verified Skill DNA.

---

## 6. Skill-Gap States and Their Exact Definitions

The roadmap engine evaluates every required skill against real candidate evidence and assessment history, categorizing each into exactly one of six mutually exclusive, explainable states:

| Gap State | Evaluation Rule | Explanatory Rationale |
|---|---|---|
| `evidence_supports_target` | Passing score ($\ge 70\%$) on standardized technical assessment OR approved faculty review. | Empirical evidence confirms proficiency meeting or exceeding the target requirement. |
| `development_indicated` | Assessment attempt exists with score $< 70\%$, OR evidence exists with identified growth areas. | Standardized assessment was completed, revealing targeted areas for improvement. |
| `unassessed` | Known canonical skill in taxonomy with zero submitted evidence or assessment attempts. | Competency has not yet been demonstrated; student is encouraged to take the technical benchmark. |
| `evidence_pending` | Student has submitted portfolio/code evidence which is currently awaiting faculty review. | Evidence has been submitted and is queued for academic advisor verification. |
| `evidence_rejected` | Submitted evidence was rejected by faculty during mentorship review. | Previous evidence did not meet qualification standards; new submission or assessment required. |
| `requirement_unresolved` | Target skill mentioned in job requisition cannot be mapped to the canonical 10-skill taxonomy. | Skill requisition requires manual alignment or custom platform evaluation. |

---

## 7. The Recommendation Algorithm and Its Version

**Algorithm Identifier:** `v1.0.0-deterministic-roadmap`  
**Execution Characteristics:** Deterministic, rule-based, idempotent, explainable.

### Prioritization Rules
Recommendations are sorted strictly by operational urgency:
1. **Priority 1 (Urgent: Retake Assessment):**
   - Condition: Skill state is `development_indicated`.
   - Action: Retake the standardized technical assessment after reviewing identified gap topics.
2. **Priority 2 (High: Initial Assessment Benchmark):**
   - Condition: Skill state is `unassessed` and a platform assessment exists.
   - Action: Take the standardized benchmark assessment to establish verified empirical Skill DNA.
3. **Priority 3 (Medium: Request Verification / Faculty Review):**
   - Condition: Skill has self-reported evidence or is `evidence_rejected`.
   - Action: Submit documented project evidence or consult faculty mentor for evaluation.
4. **Priority 4 (Medium-Low: Practice Project):**
   - Condition: In-platform guided practice project available in `learning_activities`.
   - Action: Build and deploy the guided project to solidify practical engineering competencies.
5. **Priority 5 (Low: Advanced Code Challenge):**
   - Condition: Advanced algorithmic or architectural challenge available in catalogue.
   - Action: Complete the challenge to expand edge-case problem solving.

---

## 8. How Evidence Confidence and Proficiency Are Kept Distinct

Phase 9 strictly adheres to the mathematical separation established in Phase 8.1:

1. **Proficiency Score ($0 - 100$):**
   - Represents empirical mastery evaluated through server-graded objective technical assessments.
   - Self-reported claims and unassessed skills carry an explicit proficiency of `null` and are classified as `Unassessed`.
2. **Confidence Score ($0.000 - 1.000$):**
   - Represents evidential corroboration computed via the independent probability formula:
     $$C = 1 - \prod_{i=1}^{n} (1 - c_i)$$
   - Self-reported unverified evidence is strictly bounded to $C \le 0.350$.
   - Faculty approval elevates confidence to $C = 0.750$.
   - Standardized assessment passage elevates confidence to $C = 0.850$.
3. **Academic Integrity Protection:**
   - Marking a recommendation task as `completed` updates `roadmap_recommendations.status = 'completed'` to allow students to track their personal learning workflow.
   - **Crucially, completing a roadmap task never writes to `skill_evidence`, never modifies `candidate_skills`, and never fabricates passing scores in `candidate_skill_dna`.** Competency elevation occurs solely through server-side assessment submissions or authorized faculty review.

---

## 9. Available Practice Activities and Validated External Resources

Seeded in PostgreSQL `learning_activities` table across canonical skill competencies:

1. **API Security:**
   - *Benchmark:* Standardized API Security & JWT Authentication Benchmark (Assessment 2).
   - *Practice Project:* Zero-Trust API Gateway with Rate Limiting and Token Revocation.
2. **Database Query Optimization:**
   - *Benchmark:* Database Query Optimization & Indexing Benchmark (Assessment 3).
   - *Practice Project:* High-Throughput PostgreSQL Indexing & EXPLAIN ANALYZE Workshop.
3. **Backend Architecture:**
   - *Benchmark:* Backend Architecture & Distributed Systems Benchmark (Assessment 1).
   - *Practice Project:* Event-Driven Microservices Architecture with Transactional Outbox.
4. **Concurrency Control:**
   - *Practice Project:* High-Concurrency Distributed Lock & Semaphore Manager.
   - *Challenge:* Thread-Safe Bounded Ring Buffer Implementation.
5. **Distributed Systems:**
   - *Practice Project:* Raft Consensus Cluster Simulation & Leader Election.
6. **Docker:**
   - *Practice Project:* Multi-Stage Production Dockerization with Security Hardening.
7. **Cloud Native:**
   - *Practice Project:* Cloud Native Resiliency Patterns: Circuit Breakers & Dead Letter Queues.
8. **Memory Management:**
   - *Challenge:* Custom Off-Heap Buffer Pool Allocator in C/Rust.
9. **RESTful API Design:**
   - *Practice Project:* Idempotent REST API Architecture with Contract-First OpenAPI Specs.
10. **Data Structures & Algorithms:**
    - *Challenge:* Dynamic Segment Tree with Lazy Propagation.

---

## 10. Recommendation Persistence, Idempotency, and Lifecycle Results

### Idempotency
- Recommendations generate deterministic keys based on student ID, goal ID, skill slug, and activity type:
  `rec:cand_<id>:goal_<id>:skill_<slug>:<type>`
- PostgreSQL enforces uniqueness with:
  ```sql
  CONSTRAINT uq_roadmap_rec_key UNIQUE (roadmap_id, recommendation_key)
  ```
- Re-triggering `generateDevelopmentRoadmap` uses `ON CONFLICT (roadmap_id, recommendation_key) DO UPDATE` to update priority and rationale while strictly preserving user-set progress statuses (`in_progress`, `completed`, `dismissed`).

### Lifecycle Transitions Verified
- `active` $\rightarrow$ `in_progress` $\rightarrow$ `completed`
- `active` $\rightarrow$ `dismissed`
- Disallowed status transitions reject with descriptive HTTP 400 errors.

---

## 11. Student, Faculty, Recruiter, and Administrator Access Boundaries

Strict role-based access control (RBAC) and tenant isolation were implemented and verified:
- **Student:** Can view their own goal, roadmap, gap diagnostics, and update their own recommendation statuses. Denied access to other candidates' roadmaps (HTTP 403 Forbidden).
- **Faculty:** Retains exclusive authority to verify or reject portfolio evidence. Cannot manipulate student roadmaps directly.
- **Recruiter:** Restricted to viewing sanitized candidate Skill DNA summaries and verified evidence. Cannot inspect student study plans or recommendation progress.
- **College Administrator / Super Administrator:** Can observe aggregate competency telemetry without altering individual roadmap task lifecycles.

---

## 12. Actual PostgreSQL Integration Results

Live database operations verified against PostgreSQL 18.1:
- `student_goals` rows created, updated, and queried with foreign key checks against `candidates` and `jobs`.
- `learning_activities` catalogued with 13 pre-seeded activities correctly joined to `canonical_skills`.
- `development_roadmaps` snapshot rows recorded with computed readiness scores and valid JSONB gap summaries.
- `roadmap_recommendations` correctly stored with normalized foreign keys and unique key constraints.
- Transactional rollbacks tested and confirmed safe on simulated database failures.

---

## 13. Automated Test Suite Results

All automated tests across backend, ML, frontend, and browser suites were executed and verified:

| Test Suite | Framework | Tests Executed | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|---|
| Backend Integration & Core | Node.js Test Runner | 142 | 142 | 0 | 0 | 203.88s |
| Python ML & Live Matching | Python `unittest` | 22 | 22 | 0 | 0 | 9.46s |
| Frontend Component & Role | Node.js / Vitest | 15 | 15 | 0 | 0 | 0.37s |
| Browser End-to-End Workflows | Playwright (Chromium) | 15 | 15 | 0 | 0 | 37.00s |
| **Total Automated Tests** | | **194** | **194** | **0** | **0** | **250.71s** |

### Backend Test Suites Breakdown (142 Tests)
- `phase9_personalized_roadmaps.test.js`: 13 passing tests.
- `phase8_1_audit_semantics.test.js`: 10 passing tests.
- `phase8_skill_dna_engine.test.js`: 12 passing tests.
- `phase7_six_role_workflows.test.js`: 14 passing tests.
- `phase6_1_e2e_live_matching.test.js`: 4 passing tests.
- `phase6_1_outbox_atomicity.test.js`: 4 passing tests.
- `six_roles_and_queue.integration.test.js`: 13 passing tests.
- `postgres_persistence.integration.test.js`: 11 passing tests.
- `dynamic_indexing.integration.test.js`: 6 passing tests.
- `phase5_e2e_workflows.test.js`: 8 passing tests.
- `http.integration.test.js`: 9 passing tests.
- `auth.middleware.test.js`: 6 passing tests.
- `roles.test.js`: 6 passing tests.
- `security.auth.test.js`: 10 passing tests.
- `migrations.test.js`: 4 passing tests.
- `ml.contract.test.js`: 12 passing tests.

---

## 14. Lint and Production-Build Results

- **Frontend ESLint:**
  ```bash
  cd SkillVerse/Frontend && npm run lint
  # Exit Code: 0 (0 errors, 0 warnings with --max-warnings 0)
  ```
- **Frontend Production Build:**
  ```bash
  cd SkillVerse/Frontend && npm run build
  # Exit Code: 0
  # ✓ 2272 modules transformed.
  # dist/index.html                     0.50 kB │ gzip:   0.34 kB
  # dist/assets/index-DAciyuBC.css     98.00 kB │ gzip:  13.93 kB
  # dist/assets/index-CkiyeNKP.js   1,032.37 kB │ gzip: 250.39 kB
  # ✓ built in 23.36s
  ```

---

## 15. Workflow Execution Status Matrix

| Major Workflow | Status | Verification Evidence |
|---|---|---|
| Student Goal Selection (Role Preset) | **PASS** | Verified via backend suite Suite 2 and browser UI modal. |
| Student Goal Selection (Recruiter Job) | **PASS** | Verified via backend suite Suite 3; extracts job skills dynamically. |
| Explainable Skill Gap Diagnostic (6 States) | **PASS** | Verified via backend suite Suite 3 with real Skill DNA evidence. |
| Deterministic Recommendation Generation | **PASS** | Engine `v1.0.0-deterministic-roadmap` sorts by urgency 1–5. |
| Recommendation Lifecycle Updates | **PASS** | Validated state transitions `active` $\rightarrow$ `in_progress` $\rightarrow$ `completed`. |
| Academic Integrity Protection | **PASS** | Test verifies completing tasks does not alter Skill DNA scores. |
| Cross-Tenant & RBAC Isolation | **PASS** | Student 2 strictly denied access to Student 1 recommendations (403). |
| Dynamic In-Platform Learning Catalogue | **PASS** | 13 activities queryable with skill-slug filtering. |
| Browser E2E Role Navigation | **PASS** | 15 Playwright browser tests pass across all 6 roles and viewports. |
| Production TypeScript Build & Lint | **PASS** | 0 lint warnings; clean Vite production compilation. |

---

## 16. Remaining Data-Model Limitations and Unimplemented Capabilities

1. **Course Provider Webhooks:** The learning activities catalogue links to in-platform benchmarks and code repositories; automatic completion via third-party LMS providers (e.g., Coursera/edX webhooks) is not implemented.
2. **Interactive In-Browser Code Execution:** Code challenges provide problem statements and project prompts, but code execution currently evaluates via local repository link submission rather than a sandboxed browser IDE.
3. **Recruiter Customized Weighting:** Recruiter jobs currently weigh all parsed required skills equally in readiness score calculation; per-skill custom weights could be added in future iterations.

---

## 17. Final Git Working-Tree Status

The repository working directory remains clean of any destructive git actions:
- **Active Branch:** `main`
- **HEAD Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Uncommitted Modifications:** Controlled to Phase 9 schema migration, backend routes/services/controllers, frontend learning interface, tests, and documentation.
- **Model Artifacts:** Preserved and validated.
- **All 15 Historical Reports:** Intact.

---
*End of SkillVerse Phase 9 Delivery Report.*
