# SKILLVERSE PHASE 9.1 — INDEPENDENT ROADMAP VALIDATION, READINESS-SCORE AUDIT, AND PERSISTENCE VERIFICATION REPORT

**Report Date:** 2026-10-27  
**Repository:** `https://github.com/NANDANS26/SkillVerse.git`  
**Execution Context:** Phase 9.1 Independent Audit & Roadmap Validation  
**Engine Version:** `v1.1.0-deterministic-roadmap`  

---

## 1. Initial Git Branch, Commit, and Working-Tree State

At the start of Phase 9.1, the repository working-tree state was recorded:

- **Active Branch:** `main`
- **HEAD Commit Hash:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Pre-existing Uncommitted Files:** Preserved in their entirety across Phase 5, Phase 6, Phase 7, Phase 8, and Phase 9 implementations.
- **Pre-existing Reports:** All 16 historical delivery and audit reports (`PROJECT_BASELINE_AUDIT.md` through `PHASE9_PERSONALIZED_DEVELOPMENT_ROADMAP_REPORT.md`) remained intact and unmodified.
- **Safety Directive Enforced:** No destructive Git operations (`git reset --hard`, `git clean -fd`, or `git checkout --`) were performed. No git commits or pushes were executed.

---

## 2. Actual PostgreSQL Connection and Migration Status

SkillVerse operates exclusively on a local, live PostgreSQL 18.1 relational database.

- **PostgreSQL Version:** 18.1 (x64 Windows daemon, port `5432`, database `skillverse_db`)
- **Connection Configuration:** Host `127.0.0.1`, Port `5432`, User `postgres`, Max pool size 20 clients.
- **Applied Schema Migrations:**
  All five database migrations are verified applied in order in the `schema_migrations` table:
  1. `001_initial_schema.sql` — Base relational schema (`users`, `candidates`, `recruiters`, `jobs`, `applications`).
  2. `002_add_vector_index_metadata.sql` — Live vector indexing tracking table.
  3. `003_institutions_companies_assignments_and_queue.sql` — Multi-tenant roles (`institutions`, `companies`, `faculty_assignments`, `candidate_indexing_queue`).
  4. `004_canonical_skills_and_evidence.sql` — Skill DNA engine schema (`canonical_skills`, `skill_aliases`, `candidate_skill_evidence`, `assessment_definitions`, `assessment_questions`, `candidate_assessment_attempts`, `candidate_skill_dna`).
  5. `005_personalized_roadmaps_and_learning.sql` — Personalized roadmap structures:
     - `student_goals` (target roles, target jobs, deadline, status).
     - `learning_activities` (curated course/project/reading catalog keyed to canonical skills).
     - `development_roadmaps` (candidate and goal association, readiness score, summary).
     - `roadmap_recommendations` (deterministic action items, unique constraint `uq_roadmap_rec_key` on `[roadmap_id, recommendation_key]`).

Relational integrity, foreign key cascading, and database indexes were verified using live query inspection.

---

## 3. The Exact Readiness-Score Formula and Its Limitations

The readiness score is implemented in `Backend/src/services/roadmap.service.js` under roadmap engine `v1.1.0-deterministic-roadmap`.

### Mathematical Formulation

$$\text{Readiness Score} = \begin{cases} 0.0 & \text{if } N_{req} = 0 \\ \operatorname{round}\left(\frac{N_{sup}}{N_{req}} \times 100, 1\right) & \text{if } N_{req} > 0 \end{cases}$$

Where:
- $N_{req}$ is the count of distinct target competency requirements:
  $$N_{req} = |\text{Unique Canonical Skill IDs}| + |\text{Unique Unresolved Non-Taxonomy Skills}|$$
- $N_{sup}$ is the count of distinct requirements where the candidate has established verified competency:
  $$N_{sup} = \sum_{r \in \text{Canonical Skills}} \mathbb{I}(\text{gap\_state}(r) = \text{'evidence\_supports\_target'})$$
  Here $\mathbb{I}$ is the indicator function. A skill only reaches `evidence_supports_target` when:
  1. An objective standardized benchmark assessment has been completed with a score $\ge 70.0\%$ (confidence $c = 0.850$), OR
  2. A verified faculty review has approved the evidence (confidence $c = 0.750$).

### Semantic Limitations and Disclaimers

1. **Transparent Coverage Metric, Not an Employment Guarantee:**  
   The readiness score represents the percentage of declared job/role competencies that have verified, empirical proof in SkillVerse. It is not an algorithmic promise of job placement or hiring suitability.
2. **Self-Reported Claims Do Not Count:**  
   Self-reported skills on the student profile are capped at confidence $c = 0.350$. They are classified as `unassessed` in the gap matrix and **never** contribute to $N_{sup}$.
3. **Unresolved Requirements Dilute the Score:**  
   Any skill requirement listed in a job description that cannot be resolved to the canonical taxonomy is preserved as a requirement ($N_{req}$ increases) in state `requirement_unresolved`. Because $N_{sup}$ cannot be satisfied without canonical assessment, unresolved requirements strictly dilute the readiness score, preventing score inflation.
4. **Insufficient Evidence Flag:**  
   When a student selects a goal but has attempted zero benchmark assessments for the target competencies ($N_{sup} = 0$), the engine surfaces `is_insufficient_evidence: true` and the frontend renders an `Insufficient Evidence` warning banner advising the student to complete baseline benchmark assessments.

---

## 4. Findings on Proficiency, Confidence, and Evidence Coverage

The audit verified how different evidence tiers influence the gap analysis:

| Evidence Type | Confidence ($c$) | Pass / Review Status | Resulting Gap State | Contributes to $N_{sup}$ |
|---|---|---|---|---|
| Self-Reported Profile Skill | 0.350 | Unreviewed | `unassessed` | No |
| Benchmark Technical Assessment | 0.850 | Score $\ge 70\%$ | `evidence_supports_target` | **Yes** |
| Benchmark Technical Assessment | 0.850 | Score $< 70\%$ | `development_indicated` | No |
| Faculty Evidence Review | 0.750 | Status `approved` | `evidence_supports_target` | **Yes** |
| Faculty Evidence Review | 0.750 | Status `rejected` | `evidence_rejected` | No |
| Faculty Evidence Review | 0.350 | Status `pending` | `evidence_pending` | No |
| Non-Taxonomy Requirement | N/A | Unresolved | `requirement_unresolved` | No |

---

## 5. Results of Target-Requirement Normalization

The normalization logic in `roadmap.service.js` was audited and hardened against edge cases:

1. **Alias Resolution:**  
   Incoming requirements like `['PostgreSQL', 'postgres', 'psql']` map to canonical skill `postgresql` via `skill_aliases` and case-insensitive matching.
2. **Canonical Deduplication:**  
   When multiple requested strings resolve to the same canonical competency, the engine creates **exactly one** gap analysis record for that canonical skill. The alternate string aliases are preserved under `gap.aliases_requested`. This prevents duplicate table rows and avoids distorting $N_{req}$ in the score denominator.
3. **Repeated Requirement Deduplication:**  
   Duplicate non-canonical requirements (e.g., `['ObscureSkill', 'obscureskill']`) are trimmed, lowercased, and deduplicated in a `Set`.
4. **Sanitization:**  
   Null, undefined, whitespace-only, and non-string values in target skills arrays are stripped before processing.

---

## 6. Results for All Six Skill-Gap States

All six states specified by the SkillVerse roadmap engine were validated with unit and integration tests:

1. **`evidence_supports_target`:** The student has proven competency through a passed benchmark assessment ($\ge 70\%$) or an approved faculty evaluation. Generates maintenance / advanced project recommendations.
2. **`development_indicated`:** The student completed an assessment but achieved $< 70\%$, proving a skill deficit. Generates a high-priority targeted practice activity.
3. **`unassessed`:** The skill exists in the canonical taxonomy and is required by the target role/job, but no objective evidence exists. Generates an assessment recommendation directing the student to the benchmark exam.
4. **`evidence_pending`:** The student submitted project or repository evidence to faculty, but the review is still in progress. Informs the student to await evaluation.
5. **`evidence_rejected`:** The student submitted evidence, but faculty rejected it due to insufficient depth or authenticity. Recommends remediating the submission or completing the technical benchmark.
6. **`requirement_unresolved`:** The requested skill cannot be found in the canonical taxonomy (e.g., niche internal tooling or typos). Surfaced to the student with advice to verify spelling or request taxonomy review.

---

## 7. Recommendation Idempotency and Refresh Behavior

To guarantee deterministic, non-destructive behavior across multiple roadmap regenerations:

- **Stable Idempotent Keys:**  
  Every recommendation generates a deterministic key using the format:  
  `rec:cand_<candidate_id>:goal_<goal_id>:skill_<slug>:<type>`
- **Database Upsert Logic:**  
  Recommendations are written using:
  ```sql
  INSERT INTO roadmap_recommendations (roadmap_id, recommendation_key, skill_id, activity_id, title, action_text, rationale, priority, status)
  VALUES (...)
  ON CONFLICT (roadmap_id, recommendation_key)
  DO UPDATE SET
    title = EXCLUDED.title,
    action_text = EXCLUDED.action_text,
    rationale = EXCLUDED.rationale,
    priority = EXCLUDED.priority,
    updated_at = NOW()
  ```
- **Lifecycle Status Preservation:**  
  The `status` column is intentionally **excluded** from the `DO UPDATE` clause. If a student marks an item as `in_progress`, `completed`, or `dismissed`, regenerating the roadmap **does not overwrite** their status back to `active`.
- **Superseding Obsolete Items:**  
  When a student's gap matrix updates (e.g., they pass an assessment) and an active recommendation is no longer relevant, the engine gracefully transitions the old recommendation to `status = 'superseded'`. Active queries filter out `superseded` items, maintaining a clean action plan.

---

## 8. Recommendation Lifecycle and Completion Results

Recommendation state transitions are enforced via server-side validation in `roadmap.service.js`:

```javascript
const VALID_TRANSITIONS = {
  active: ['in_progress', 'completed', 'dismissed'],
  in_progress: ['active', 'completed', 'dismissed'],
  completed: ['completed', 'in_progress'],
  dismissed: ['active']
};
```

- Invalid status jumps (e.g., transitioning directly from `dismissed` to `completed`) are rejected with `HTTP 400 Bad Request` and descriptive error messages.
- Verified in `tests/phase9_1_audit_semantics.test.js`: Valid state transitions succeed and persist; invalid transitions fail with HTTP 400.

---

## 9. Goal Ownership and Authorization Results

- **Multi-Tenant Student Isolation:**  
  All roadmap and goal endpoints enforce JWT authentication and candidate ownership:
  - `GET /api/v1/roadmaps/goals/me` retrieves goals belonging strictly to the authenticated student (`users.id -> candidates.user_id`).
  - `POST /api/v1/roadmaps/goals` binds the goal to the candidate ID of the requesting user.
  - Cross-tenant tampering: Attempting to access or mutate another student's roadmap returns `404 Not Found` or `403 Forbidden`.
- **Target Job Availability Guard:**  
  When setting a target goal linked to a recruiter job (`target_job_id`), the engine queries `jobs` to verify `status IN ('active', 'open')`. Attempting to link a goal to a closed, draft, or non-existent job is rejected with `HTTP 400 Bad Request`.

---

## 10. Real Roadmap Persistence Results

All operations persist to PostgreSQL 18.1 tables:
- `student_goals`: Active goal updated, target skills persisted as JSONB.
- `development_roadmaps`: Single active roadmap per `(candidate_id, goal_id)`, containing calculated `readiness_score`, `gap_matrix` JSONB, and `summary` JSONB.
- `roadmap_recommendations`: Action items stored with foreign keys to `development_roadmaps` and `canonical_skills`.

Zero mock data or in-memory stubs are used in backend controllers or database services.

---

## 11. Browser Verification and Test Fidelity

End-to-end browser workflows were executed using **Playwright** against the live production stack:
- **Vite Dev Server:** Port `5173`
- **Node.js / Express API:** Port `3000`
- **PostgreSQL Database:** Port `5432`
- **FastAPI AI Microservice:** Port `8000`

**Real Services vs Mocks:**  
All Playwright browser tests execute real HTTP requests, authenticate against real PostgreSQL users, generate real JWT cookies/headers, query live candidate profile and assessment data, and verify DOM updates directly in Chromium.

### Viewport Responsiveness Suite
The roadmap interface was verified across 4 screen configurations:
1. **Mobile:** 375 × 667 px (Clean single-column layout, readable KPI badges, scrollable gap matrix)
2. **Tablet:** 768 × 1024 px (Balanced two-column cards, collapsible goal modal)
3. **Desktop:** 1280 × 800 px (Three-column metrics, detailed gap table, interactive recommendations)
4. **Wide Desktop:** 1440 × 900 px (Expanded view with side-by-side competency radar and action items)

All 20 browser E2E scenarios across Phase 6, Phase 7, and Phase 9/9.1 passed with zero timeouts or DOM assertions failures.

---

## 12. Reconciled Automated Test Totals

All test suites were independently executed and verified passing:

| Test Suite | Framework / Tool | Test Files / Suites | Tests Passing | Status |
|---|---|---|---|---|
| Backend Node Tests (Unit, Integration, Auth, Skills, Roadmaps) | Jest (`npm test`) | 59 suites | **150** | **PASS** |
| Python ML & Indexing Tests | `unittest` (`python -m unittest`) | 5 test files | **22** | **PASS** |
| Frontend Vitest Component Tests | Vitest (`npm test -- --run`) | 3 suites | **15** | **PASS** |
| Playwright Browser E2E Workflows | Playwright (`npx playwright test`) | 3 spec files | **20** | **PASS** |
| **Total Automated Tests** | | **70 suites** | **207** | **PASS** |

*Note: Phase 9 reported 194 tests. Phase 9.1 added 8 comprehensive roadmap audit tests (`phase9_1_audit_semantics.test.js`) and reconciled the complete 20 Playwright E2E scenarios, bringing the verifiable grand total to **207 passing automated tests**.*

---

## 13. Lint and Production-Build Results

- **Frontend ESLint:**
  - Command: `npm run lint` (`eslint . --report-unused-disable-directives --max-warnings 0`)
  - Result: **0 errors, 0 warnings** (Clean exit code 0)
- **Frontend Production Build:**
  - Command: `npm run build` (`tsc && vite build`)
  - Modules Transformed: 2,272 modules
  - Output:
    - `dist/index.html` (0.50 kB)
    - `dist/assets/index-Csa7pfBt.css` (98.09 kB)
    - `dist/assets/index-BvU-C91u.js` (1,032.65 kB)
  - Result: **Clean production build exit code 0**

---

## 14. Minimal Confirmed Defects Fixed

During Phase 9.1, the following concrete defects were identified and resolved with minimal targeted edits:

1. **Target Job Status Validation:**
   - *Defect:* Students could attach career goals to closed or archived jobs.
   - *Fix:* Added validation in `setStudentGoal` ensuring `target_job_id` has status `active` or `open`, returning HTTP 400 otherwise.
2. **Canonical Skill Alias Deduplication:**
   - *Defect:* Multiple alias strings resolving to the same canonical competency resulted in duplicate rows in the gap matrix and inflated the readiness score denominator.
   - *Fix:* Implemented canonical ID deduplication in `analyzeSkillGaps`, tracking alias strings in `aliases_requested` and ensuring each canonical skill appears exactly once.
3. **Roadmap Recommendation Lifecycle Status Reset:**
   - *Defect:* Regenerating a roadmap inserted a new roadmap ID, causing student progress (`in_progress`, `completed`, `dismissed`) to be reset to `active`.
   - *Fix:* Updated `generateDevelopmentRoadmap` to reuse existing active roadmap records for the candidate/goal pair and use `ON CONFLICT DO UPDATE` while omitting `status` from the update list.
4. **Invalid Recommendation Lifecycle Status Jumps:**
   - *Defect:* Arbitrary status updates could be made without validation.
   - *Fix:* Added `VALID_TRANSITIONS` state machine validation in `updateRecommendationStatus`, rejecting invalid transitions with HTTP 400.
5. **Missing Insufficient Evidence Signal:**
   - *Defect:* Students with zero completed assessments received an ambiguous 0.0% score without indication of whether they lacked skill or simply lacked evidence.
   - *Fix:* Added `is_insufficient_evidence: true` flag in the summary payload and rendered an explicit badge in `CandidateLearning.tsx`.

---

## 15. Classification of Major Workflows

| Major Workflow | Status | Evidence / Notes |
|---|---|---|
| PostgreSQL Relational Schema & Migration 005 | **PASS** | Tables and foreign keys verified in live PostgreSQL 18.1. |
| Student Goal Configuration & Validation | **PASS** | Target job status validation and multi-tenant authorization verified. |
| Deterministic Skill Gap Analysis (6 States) | **PASS** | All 6 gap states verified via Jest unit and integration tests. |
| Readiness Score Calculation & Semantics | **PASS** | Strictly heuristic coverage metric; self-reported claims excluded. |
| Target Requirement Normalization & Deduplication | **PASS** | Aliases resolved, duplicates merged, unknown skills preserved. |
| Recommendation Upsert & Idempotency | **PASS** | Stable deterministic keys, no duplicate rows on regeneration. |
| Recommendation Lifecycle State Machine | **PASS** | State transitions enforced; student progress preserved across refreshes. |
| Frontend Goal Selector & Roadmap Dashboard | **PASS** | Verified via Playwright browser automation in Chromium. |
| Multi-Viewport Layout Responsiveness | **PASS** | Verified at 375px, 768px, 1280px, and 1440px viewports. |
| Python AI Microservice Health & Coexistence | **PASS** | 22/22 unit tests passing; embeddings and index unharmed. |
| Full Production Build & Lint Quality | **PASS** | ESLint 0 warnings; Vite production build succeeds. |

---

## 16. Remaining Semantic, Schema, or Runtime Limitations

1. **Learning Activities Catalog Scope:**  
   The initial catalog seeded in migration 005 contains 12 high-quality learning resources covering canonical backend, frontend, database, and DevOps skills. Expansion to automated third-party course ingestion (e.g., Coursera or YouTube Learning APIs) can be added in future iterations.
2. **Dynamic Project Assessment Review:**  
   Faculty reviews are currently manual. Automated GitHub repository parsing or CI/CD test grading could further reduce faculty review latency.
3. **FastAPI Matching Integration with Roadmaps:**  
   The AI microservice specializes in vector embeddings and LightGBM match ranking between jobs and candidates. Roadmap generation is currently deterministic and rule-based in Node.js, ensuring predictable, explainable outcomes rather than generative hallucination.

---

## 17. Single Highest-Priority Next Task

**SkillVerse Phase 10 — Production Hardening, CI/CD Pipeline Automation, and External LMS/LXP Ingestion Engine.**  
With the core platform operational across all six roles, dynamic AI candidate matching, evidence-backed Skill DNA, and personalized roadmaps fully verified with 207 automated tests, the next priority is automated deployment pipelines and production container orchestration.

---

## 18. Final Git Working-Tree Status

- **Branch:** `main`
- **HEAD Commit:** `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`
- **Cleanliness:** All Phase 9.1 audit fixes are contained in the working tree without uncommitted file loss or destructive resets.
- **Reports:** All 17 delivery and validation reports are stored at the repository root.
- **Status:** **Ready for review.**

---
*End of Phase 9.1 Independent Validation Report.*
