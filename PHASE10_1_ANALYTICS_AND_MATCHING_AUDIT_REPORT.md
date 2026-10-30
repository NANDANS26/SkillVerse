# SKILLVERSE PHASE 10.1: INDEPENDENT ANALYTICS AUDIT, TENANT-ISOLATION VERIFICATION, AND AI MATCHING REGRESSION REPORT

## 1. Initial Branch, Commit, and Working-Tree Status
- **Repository**: `https://github.com/NANDANS26/SkillVerse.git`
- **Initial Branch**: `main`
- **Initial HEAD Commit**: `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Working-Tree Status**: All modified files and untracked reports/artifacts from Phases 1 through 10 have been preserved without destructive git operations (`git reset --hard`, `git clean -fd`, or unapproved deletions were strictly avoided).
- **Report Succession**: This report acts as milestone report #19, independently auditing report #18 (`PHASE10_SKILL_INTELLIGENCE_ANALYTICS_REPORT.md`).

---

## 2. Actual PostgreSQL, Express, FastAPI, and Frontend Runtime Status

| Service Component | Runtime Architecture | Verified Port / Host | Actual Observed State | Verification Evidence |
|---|---|---|---|---|
| **PostgreSQL Engine** | PostgreSQL 18.1 (x86_64-windows) | Port `5432`, DB `skillverse` | **ONLINE & ACCEPTING CONNECTIONS** | `pg_isready -U postgres` returned exit code 0 (`accepting connections`). Read/Write transaction probe succeeded. |
| **Backend API Server** | Node.js v24.13.0 + Express | Port `3000` | **ONLINE & FUNCTIONAL** | `GET /health` returned `200 OK` with `{"status":"healthy","service":"skillverse-backend"}`. Analytics routes mounted at `/api/analytics` and `/api/v1/analytics`. |
| **AI Matching Microservice** | Python 3.11 + FastAPI + Uvicorn | Port `8000` | **ONLINE & RESPONSIVE** | `GET /api/v1/health` returned `{"status":"ok","message":"ML service running"}`. `GET /api/v1/index_status` returned 344 live candidate vectors and 5,000 benchmark vectors. |
| **Frontend Application** | React 18 + Vite 5.4.8 | Port `5173` | **ONLINE & FUNCTIONAL** | `GET http://127.0.0.1:5173` returned `200 OK` serving `<title>SkillVerse \| AI Powered Smart Hiring Platform</title>`. |

---

## 3. Analytics Metrics, Definitions, and Source Tables

| Metric Name | Source Table(s) | Calculation & Logic | Filters & Scoping Applied |
|---|---|---|---|
| **Assessment History Over Time** | `assessment_attempts`, `assessments`, `skills` | `SELECT aa.score, aa.passed, aa.completed_at FROM assessment_attempts aa` joined on `a.id` and `s.id`. | Scoped to authenticated candidate (`aa.candidate_id = $1`). Ordered chronologically ascending. |
| **Assessed Competencies** | `assessment_attempts`, `assessments`, `skills` | Distinct canonical skills where `aa.passed = true` with `MAX(aa.score)`. | Scoped to authenticated candidate. Grouped by `s.id, s.name, s.slug`. |
| **Faculty Reviewed Competencies** | `skill_evidence`, `skills` | Distinct skills with `source_type IN ('faculty_review', 'project_submission')` and `review_status = 'verified'`. | Scoped to candidate. Excludes pending or rejected evidence. |
| **Evidence Review Backlog** | `skill_evidence` | Count of evidence items with `review_status IN ('pending', 'unreviewed')`. | Scoped to authenticated candidate (student view) or institution/mentorship roster (admin/faculty view). |
| **Roadmap Lifecycle Distribution** | `roadmap_recommendations` | Counts grouped by `status` (`active`, `in_progress`, `completed`, `dismissed`). | Scoped to candidate. Excludes `superseded` recommendations. |
| **Target Requirement Coverage Delta** | `development_roadmaps`, `student_goals` | Readiness score and historical evaluations tracked across roadmap updates. | Scoped to candidate's active target role goals. |
| **Institution Mentorship Coverage** | `faculty_student_assignments`, `institution_memberships` | `(assigned_students / total_enrolled_students) * 100`. | Scoped strictly to administrator's authorized `institution_id`. |
| **Institution Skill Distribution** | `skills`, `institution_memberships`, `candidates`, `assessment_attempts`, `skill_evidence` | Distinct student counts across 3 verified/pending states per canonical skill. | Enforces institution tenant membership. Uses `COUNT(DISTINCT c.id)` to prevent duplicate join counting. |
| **Faculty Mentee Coverage** | `faculty_student_assignments`, `users`, `candidates` | Active assigned mentees, pending mentee reviews, and completed review decisions. | Scoped strictly to `fsa.faculty_id = $1 AND fsa.status = 'active'`. |
| **Open Job Skill Demand** | `jobs`, `skills` | `COUNT(DISTINCT j.id)` per canonical skill after alias normalization. | Strictly filtered to `status IN ('open', 'active')`. Scoped to company for recruiter/company_admin. |
| **Candidate Supply by Tier** | `assessment_attempts`, `skill_evidence` | `COUNT(DISTINCT aa.candidate_id)` with passing score, and `COUNT(DISTINCT se.candidate_id)` with verified review. | Partitioned into Assessed vs Faculty-Reviewed vs Demonstrated Evidence Total. |
| **Demand-to-Supply Ratio** | `jobs`, `assessment_attempts`, `skill_evidence` | `Number((jobCount / verifiedSupply).toFixed(2))` when `verifiedSupply > 0`. | When `verifiedSupply = 0` and `jobCount > 0`, flagged as `null` ("Zero Verified Supply"). |
| **Unresolved Requisition Requirements** | `jobs`, `skills` | Job skills not mapping to canonical skill names or known aliases. | Grouped by case-insensitive raw name and sorted by distinct open jobs requesting. |
| **Company Application Pipeline** | `applications`, `jobs` | Counts grouped by `applications.status` across 7 stages. | Scoped to jobs belonging to `company_id`. |
| **Platform User Role Counts** | `users` | `COUNT(*)` grouped by canonical `role`. | Platform-wide aggregation (super_admin only). |
| **Indexing Queue Telemetry** | `indexing_queue` | Counts grouped by queue `status` (`pending`, `processing`, `completed`, `failed`). | Platform-wide operational telemetry. |
| **Sanitized Security Audit Log** | `audit_logs` | Selects `id, user_id, action, entity_type, entity_id, created_at` (omits sensitive metadata). | Platform-wide operational audit log (super_admin only). |

---

## 4. Findings on Duplicate Counting, Aliases, and Aggregation Correctness

1. **Duplicate Join Prevention**:
   - In `getCollegeAdminAnalytics`, joining `assessment_attempts` and `skill_evidence` simultaneously on the same student cohort risks cartesian product duplication if unconstrained. The query correctly utilizes `COUNT(DISTINCT CASE WHEN aa.passed = true THEN c.id END)` and `COUNT(DISTINCT CASE WHEN se.review_status = 'verified' THEN c.id END)`. This guarantees that multiple attempts or multiple evidence submissions by the same student never inflate the student count.
2. **Canonical Skill Alias Deduplication**:
   - In `getWorkforceDemandAnalytics`, a single open job requisition requesting synonymous aliases (e.g. `['PostgreSQL', 'psql']`) is deduplicated per job using `seenSkillIdsForJob = new Set()`. The query increments `entry.job_ids.add(job.id)` only once per canonical competency. Verified: `PostgreSQL` count is exactly 1 job, not 2.
3. **Closed and Draft Job Exclusion**:
   - Queries enforce `WHERE status IN ('open', 'active')`. Tested with job `'Archived Frontend Lead'` (`status = 'closed'`): closed jobs are excluded from open requisition demand.
4. **Demand/Supply Zero-Denominator Correction**:
   - Prior to audit, if an open job required a skill with 0 verified candidates, the formula fell back to `jobCount`, yielding `1.0` which the frontend displayed as `1x (Adequate Supply)`.
   - **Correction Implemented**: Updated `analytics.service.js` and `Analytics.tsx` so that when `verifiedSupply === 0` and `jobCount > 0`, `demand_vs_supply_ratio` is `null` with `ratio_classification: 'Zero Verified Supply'`, and the UI renders `Unmet (0 Verified Candidates)`.

---

## 5. Student, College, and Faculty Authorization Results

1. **Student Authorization (`/analytics/student`)**:
   - Scoped strictly to `req.user.id`. Accessing another student's candidate profile is impossible because the candidate ID is resolved directly from the authenticated session (`WHERE user_id = $1`).
   - If a student has no assessment attempts and no verified reviews, `is_insufficient_evidence: true` is returned, displaying the honest advisory banner rather than blank charts.
2. **College Administrator Multi-Tenant Scoping (`/analytics/college`)**:
   - Tested with two distinct institutional tenants: `institutionId1` and `institutionId2`.
   - For `collegeAdminUser1`, the endpoint derives `institutionId1` from `institution_memberships WHERE user_id = $1`.
   - **Injection Probe**: Passing `?institution_id=<foreign_id>` was tested. The controller strictly ignores the query parameter and queries only `institutionId1`.
   - Student and faculty counts, mentorship coverage, and evidence review backlogs are strictly partitioned by institution.
3. **Faculty Mentorship Boundary Scoping (`/analytics/faculty`)**:
   - Scoped strictly to `fsa.faculty_id = $1 AND fsa.status = 'active'`.
   - For `facultyUser1`, only assigned mentees (`Student 1`) and pending reviews submitted by assigned mentees are returned.
   - For `facultyUser2` (unassigned faculty), an honest zero-state is returned (`mentees: { total_count: 0 }`, `pending_backlog_count: 0`). No cross-cohort leakage occurs.

---

## 6. Company and Recruiter Tenant-Isolation Results

1. **Cross-Company Leakage Audit & Fix**:
   - **Vulnerability Identified**: In `getWorkforceDemandAnalytics`, `if (filters.company_id)` was evaluated before verifying whether the caller was authorized to filter by an arbitrary company. A malicious recruiter or company admin could pass `?company_id=<competitor_id>` to inspect proprietary demand.
   - **Fix Applied**: Updated `Backend/src/services/analytics.service.js` so that for `recruiter` and `company_admin` roles, `company_id` is forced to the user's authoritative membership from `company_memberships`. Only `super_admin` is permitted to query arbitrary `company_id` filters.
   - **Verification Test Added**: `tests/phase10_analytics_intelligence.test.js` verified that when a recruiter passes `query: { company_id: '99999' }`, the response remains strictly company-scoped to their own company (`companyId1`).
2. **Company Administrator Pipeline Analytics (`/analytics/company`)**:
   - Aggregates recruiters, job requisitions, and application pipeline status counts.
   - Scoped strictly to `cm.company_id = $1` and `j.company_id = $1`.
   - **Hiring Outcome Integrity**: The application pipeline maintains explicit separation between `interviewing`, `offered`, and `hired`. Applications with status `interviewing` do NOT increment the `hired` count.

---

## 7. Super-Administrator Telemetry and Audit-Log Findings

1. **Authoritative Metric Sources**:
   - User counts by canonical role derive directly from `SELECT role, COUNT(*)::int FROM users GROUP BY role`.
   - Queues derive live state from `indexing_queue` (`pending`, `processing`, `completed`, `failed`).
   - ML vector status queries FastAPI's live index status endpoint (`/api/v1/index_status`).
2. **Audit Log Sanitation**:
   - `SELECT id, user_id, action, entity_type, entity_id, created_at FROM audit_logs` omits sensitive metadata.
   - Tested that responses contain NO `password_hash`, `token`, `session_id`, or `service_secret`.
3. **Failed Operations Alerts**:
   - Queries `indexing_queue WHERE status = 'failed'` to alert administrators to unindexed candidate vectors requiring intervention.

---

## 8. Demand-versus-Supply Metric Definitions and Limitations

1. **Internal Telemetry vs Macroeconomic Disclaimer**:
   - The platform demand/supply ratio represents recorded open requisitions on SkillVerse compared against observable candidate evidence in the database.
   - It is explicitly labeled on all recruiter and company views:
     > *"Workforce demand and supply intelligence compares recorded open requisitions on SkillVerse with observable evidence in the candidate database. This metric is an internal telemetry sample and does not constitute national labour market forecasts or hiring predictions."*
2. **Distinction of Competency States**:
   - The engine explicitly distinguishes between:
     - *Recorded Job Requirements*: Skills extracted from active job descriptions.
     - *Self-Reported Skills*: Skills listed in candidate JSON without proof (confidence &le; 0.350).
     - *Standardized Assessment Evidence*: Verified skills with objective benchmark scores &ge; 0.700.
     - *Faculty-Reviewed Evidence*: Verified skills endorsed by an authorized faculty advisor with confidence &ge; 0.700.
   - Unverified self-reported skills are NOT counted in the verified supply denominator.

---

## 9. Detailed Review of the `match.py` Changes

### Code Modification Analysis
In `Backend/app/api/v1/match.py`, candidate retrieval was upgraded from narrow single-stage retrieval to dynamic two-stage retrieval:
1. **Search Pool Sizing (`search_k`)**:
   - Old: `raw_results = index.search(job_vec, top_k=req.top_k)`. When `top_k=10`, only 10 candidates were retrieved from FAISS before LightGBM ranking.
   - New: `search_k = min(max(req.top_k * 5, 50), live_idx.total_candidates)` for live index, and `max(req.top_k * 5, 50)` for benchmark index.
2. **Input Validation**:
   - Added Pydantic constraint `top_k: int = Field(default=10, ge=1, le=100)` to prevent excessive memory allocation or denial-of-service via huge `top_k`.
3. **Deterministic Multi-Tier Tie-Breaking**:
   - Key: `(x["match_score"], x["skill_overlap"], x["embedding_sim"], int(x.get("candidate_id") or x.get("id") or 0))`.
   - Incorporating `candidate_id` as the final tuple element ensures 100% deterministic, reproducible sorting across repeated queries.
4. **Relevance Thresholding**:
   - Retained: candidates with match score &lt; 0.1 (unless 0 skills mandated and experience matches) are pruned as non-genuine matches.

---

## 10. Pre-Change versus Post-Change Matching Results

An empirical comparison was conducted on the live candidate pool (344 indexed candidates) against job requisition *"Senior PostgreSQL and React Engineer"* requiring `['PostgreSQL', 'React']` with 2–6 years experience:

```
========================================================================================
EMPIRICAL RETRIEVAL COMPARISON (Job: Senior PostgreSQL & React Engineer)
========================================================================================
1. Pre-Change (Narrow FAISS search_k = 10):
   Retrieved Candidate IDs: [68, 43, 38, 33, 28, 22, 5, 4, 3, 2]
   Observed Issue: All 10 candidates were early-inserted test candidates with single-skill
   matches. Highly qualified multi-skill candidates were excluded from the FAISS top-10.

2. Post-Change (Two-Stage Retrieval search_k = 50 + LightGBM Re-ranking):
   Re-ranked Top 10 Candidate IDs: [338, 318, 298, 275, 259, 243, 219, 192, 174, 145]
   Rescued High-Relevance Candidates: 10 candidates rescued from beyond narrow top-10!
   
   Sample Rescued Candidate 338:
     - Match Score: 0.9970
     - Skill Overlap: 1.0000 (100% overlap with both PostgreSQL and React)
     - Experience: 4.0 years (within 2-6 year window)
     - Skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'FastAPI', 'Docker']
========================================================================================
```

**Conclusion**: The two-stage retrieval with LightGBM re-ranking does NOT inflate artificial scores. It expands the initial candidate vector search space so that candidates with full requirement overlap (`skill_overlap = 1.0`) and high composite relevance are not prematurely displaced by vector proximity alone.

---

## 11. Test Commands and Actual Reconciled Counts

### Execution Commands:
- **Backend Node.js**: `cd SkillVerse/Backend && npm test`
- **Python ML**: `cd SkillVerse/Backend && & ".venv/Scripts/python.exe" -m unittest discover -s tests -p "test_*.py"`
- **Frontend Vitest**: `cd SkillVerse/Frontend && npm test`
- **Playwright E2E**: `cd SkillVerse/Frontend && npx playwright test`

### Reconciled Test Counts:

| Test Category | Suite Count | Test Count | Pass Count | Fail Count | Execution Duration |
|---|---|---|---|---|---|
| **Backend Node.js Suites** | 67 | 166 | 166 | 0 | 272.2s |
| **Python ML Unittest Suite** | 1 | 22 | 22 | 0 | 6.3s |
| **Frontend Unit Tests** | 3 | 15 | 15 | 0 | 1.3s |
| **Playwright Browser E2E** | 4 | 27 | 27 | 0 | 51.2s |
| **TOTAL PLATFORM TESTS** | **75** | **230** | **230** | **0** | **100% Pass Rate** |

---

## 12. Real Services versus Mocks Breakdown

- **Real PostgreSQL Integration**:
  - `tests/phase10_analytics_intelligence.test.js` (16 tests): Uses real PostgreSQL database connection, live tables, dynamic multi-tenant users, institutions, companies, jobs, evidence, and applications.
  - `tests/dynamic_indexing.integration.test.js` (7 tests): Uses real PostgreSQL + live FAISS index.
  - `tests/phase6_1_outbox_atomicity.test.js` (4 tests): Uses real PostgreSQL outbox queue.
  - `tests/phase5_e2e_workflows.test.js` (6 tests): Uses real PostgreSQL.
- **Real AI Microservice & Vector Inference**:
  - Python tests (22 tests): Use real SentenceTransformer model, real FAISS index, and real LightGBM ranker.
- **Frontend Unit Tests**:
  - `tests/**/*.test.js` (15 tests): Validate schema wiring, role models, and navigation fixtures.
- **Playwright E2E Tests**:
  - `tests/e2e/*.spec.ts` (27 tests): Execute in real Chromium browser against live Node.js server (`:3000`), live Vite dev server (`:5173`), live PostgreSQL (`:5432`), and live FastAPI (`:8000`).

---

## 13. Playwright, Lint, and Production-Build Results

- **Playwright Browser E2E (27/27 Passing in 51.2s)**:
  - `phase10_analytics_workflows.spec.ts`: 7/7 passed.
  - `phase6_mvp_workflows.spec.ts`: 9/9 passed.
  - `phase7_six_role_workflows.spec.ts`: 6/6 passed.
  - `phase9_roadmap_workflows.spec.ts`: 5/5 passed.
  - Multi-viewport verification confirmed clean rendering across Mobile (375px), Tablet (768px), Desktop (1280px), and Wide (1440px).
- **Frontend ESLint (`npm run lint`)**:
  - `eslint . --report-unused-disable-directives --max-warnings 0`
  - Result: **0 errors, 0 warnings**.
- **Frontend Production Build (`npm run build`)**:
  - `tsc && vite build` succeeded in 52.2s. Generated production bundles in `Frontend/dist/`.

---

## 14. Confirmed Defects and Minimal Fixes

| Defect ID | Severity | File(s) Affected | Description of Defect | Minimal Fix Implemented |
|---|---|---|---|---|
| **DEF-01** | Medium | `Backend/src/services/analytics.service.js` | Cross-company requisition leakage: non-super_admin callers could supply arbitrary `company_id` in query parameters. | Enforced caller role check: `recruiter` and `company_admin` are strictly locked to their own company from `company_memberships`. Only `super_admin` can supply arbitrary `company_id`. |
| **DEF-02** | Low | `Backend/src/services/analytics.service.js`, `Frontend/src/pages/recruiter/Analytics.tsx` | Mathematical anomaly on 0 supply: demand/supply ratio computed `jobCount / 0` as `jobCount`, rendering `1x (Adequate Supply)` when 0 candidates were verified. | Refactored formula: when `verifiedSupply === 0` and `jobCount > 0`, ratio is `null` with `ratio_classification: 'Zero Verified Supply'`. UI renders `Unmet (0 Verified Candidates)`. |
| **DEF-03** | Low | `Backend/app/api/v1/match.py` | Potential tie-break instability & unbounded `top_k`: ties on match_score, skill_overlap, and embedding_sim lacked candidate ID tie-breaker; `top_k` was unbounded. | Added `int(x.get("candidate_id") or 0)` to tie-breaker key; added Pydantic validation `top_k = Field(default=10, ge=1, le=100)`. |
| **DEF-04** | Low | `Backend/src/services/analytics.service.js` | Job skills key variance: only checked `parsed_json.skills`, ignoring older jobs storing skills in `parsed_json.required_skills`. | Added fallback: checks `parsed_json.skills` then `parsed_json.required_skills` then `[]`. |

---

## 15. Capability Classification Matrix

| Capability ID | Major Capability / Feature Area | Target Role(s) | Status | Verification Summary |
|---|---|---|---|---|
| CAP-01 | Student Skill Intelligence & Progress | `student` | **PASS** | Verified via API tests and Playwright E2E. Renders attempts, verified skills, and roadmap lifecycle. |
| CAP-02 | Recruiter Workforce Demand Analytics | `recruiter` | **PASS** | Verified via API tests and Playwright E2E. Correctly computes distinct open job counts and unresolved skills. |
| CAP-03 | Institutional Mentorship & Evidence Tiers | `college_admin` | **PASS** | Verified via API tests and Playwright E2E. Scoped to institution with 4 evidence tiers. |
| CAP-04 | Faculty Mentee Advisory & Review Queue | `faculty` | **PASS** | Verified via API tests and Playwright E2E. Scoped strictly to assigned advisory roster. |
| CAP-05 | Corporate Talent Acquisition Funnel | `company_admin` | **PASS** | Verified via API tests and Playwright E2E. Renders 7 pipeline stages from applied to hired. |
| CAP-06 | Super Admin Operational Telemetry | `super_admin` | **PASS** | Verified via API tests and Playwright E2E. Renders role totals, sanitized audit logs, and alerts. |
| CAP-07 | Multi-Tenant Authorization & Isolation | All Roles | **PASS** | Verified via 2-institution tests and recruiter query parameter override tests. Cross-tenant leakage blocked. |
| CAP-08 | Two-Stage Vector Retrieval & LightGBM Ranking | `recruiter` | **PASS** | Verified via empirical comparison and Python unittests. 10 high-relevance candidates rescued. |
| CAP-09 | Multi-Viewport Responsive Layouts | All Roles | **PASS** | Verified across 375px, 768px, 1280px, and 1440px viewports via Playwright. |
| CAP-10 | Transactional Outbox & Queue Recovery | `super_admin` | **PASS** | Verified via `tests/phase6_1_outbox_atomicity.test.js`. |

---

## 16. Remaining Data-Quality and Model-Validation Limitations

1. **Catalog Assessment Breadth**: Standardized technical benchmark assessments currently cover Python, React, and PostgreSQL. Competencies in other canonical disciplines (Rust, Docker, Kubernetes, etc.) rely on faculty portfolio review or self-reported evidence tiers.
2. **Point-in-Time Requisition Demand**: Requisition demand represents active open jobs (`status IN ('open', 'active')`). Historical requisition trajectory does not model employer hiring velocity over multi-quarter periods.
3. **Internal Platform Telemetry**: Workforce demand/supply ratios reflect registered SkillVerse candidates and open postings. They are explicitly disclaimed as non-macroeconomic indicators.
4. **Audit Log Retention Window**: The operational dashboard displays the 20 most recent audit events for real-time observability. Deep historical compliance audits require querying the partitioned database archive.

---

## 17. Single Highest-Priority Next Task
**Production Hardening & Automated Staging Deployment**: Configure continuous integration automated database migration checks, environment secret management for production deployments, and automated FAISS snapshot backups on high-frequency candidate registration batches.

---

## 18. Final Git Working-Tree Status
- **Current Branch**: `main`
- **Base Commit**: `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Working Tree**: All existing uncommitted files and milestone reports (Phases 1 through 10) have been preserved. Phase 10.1 minimal fixes remain unstaged in accordance with explicit directives.
- **Halt Directive**: Execution halted immediately upon writing this report. Phase 11 was not initiated.

---
*Report completed on October 28, 2026. Authoritative SkillVerse Phase 10.1 Milestone Delivery.*
