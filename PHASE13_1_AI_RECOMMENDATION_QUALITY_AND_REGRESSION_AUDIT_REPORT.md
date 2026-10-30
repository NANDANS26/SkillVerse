# SKILLVERSE PHASE 13.1 — INDEPENDENT AI QUALITY, TEST INTEGRITY AND REGRESSION AUDIT REPORT

**Audit Date**: October 28, 2026  
**Auditor**: Independent AI Quality & Security Verification Agent  
**Repository**: `https://github.com/NANDANS26/SkillVerse.git`  
**Base Commit**: `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`  
**Branch**: `main`  
**Audited Deliverable**: Phase 13 AI Learning Recommendation Engine (`PHASE13_AI_LEARNING_RECOMMENDATION_ENGINE_REPORT.md`)  

---

## 1. Executive Verdict

Phase 13 delivered a genuine, locally hosted, SentenceTransformer-assisted recommendation pipeline (`all-MiniLM-L6-v2`) embedded within a multi-factor ranking heuristic for candidate learning activities. However, the accompanying audit of test executions and commit history revealed critical nuances, metric reporting ambiguities, and historical test adjustments that required rigorous investigation:

1. **Test Suite Integrity & Prior Failures**: The failed and cancelled runs recorded in the environment trajectory were thoroughly traced. They stemmed from: (a) invoking `pytest` in an environment lacking that package rather than standard `unittest`, (b) a transient stale daemon state prior to restarting the FastAPI process after endpoint registration, and (c) a field mapping defect in the initial `before` hook of `phase13_ai_recommendations.test.js` where `c1Res.body.candidate.id` was referenced instead of `c1Res.body.candidate_id`.
2. **Phase 9.1 Test Modification**: The modification to `Backend/tests/phase9_1_audit_semantics.test.js` (line 325) relaxed a strict string assertion (`'v1.1.0-deterministic-roadmap'`) to accept `ROADMAP_ENGINE_VERSION` (`'v2.0.0-ai-semantic-recommendation'`). This modification was technically warranted to allow engine version evolution, but bypassed semantic backwards-compatibility testing for legacy snapshots.
3. **Model Nature vs. Heuristic**: The ranking pipeline is **not** a trained Learning-to-Rank (LTR) model (e.g., LightGBM / LambdaMART). It is a **deterministic convex-combination scoring heuristic** over semantic cosine similarity, gap urgency, proficiency calibration, and verification payoff.
4. **Metric Reporting Provenance**: The reported gains (+9.1% Precision@3, +9.6% Recall@3, +6.8% NDCG@3) are **relative percentage improvements**, not percentage-point gains, evaluated on a small hand-crafted synthetic benchmark of 4 personas and 15 activities with manually curated ground truth.
5. **Operational Verification**: Following daemon restart and endpoint integration, the end-to-end stack—from browser UI to Node.js backend, internal service token authentication, FastAPI microservice, PyTorch/SentenceTransformers embedding cache, PostgreSQL persistence, and JSONB GIN indexing—is fully operational with **286 passing automated tests** across all 5 test layers.

---

## 2. Initial Repository State and Preservation Confirmation

Before initiating any audit steps or executing commands, the repository state was independently inspected and confirmed intact:

- **Git Status**: Clean working tree on branch `main` at commit `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`.
- **Preserved Milestone Documentation**: All 25 historical milestone reports (`PHASE2` through `PHASE13`, including intermediate audits `PHASE4_1`, `PHASE5_1`, `PHASE5_2`, `PHASE5_3`, `PHASE6_1`, `PHASE7_1`, `PHASE8_1`, `PHASE9_1`, `PHASE10_1`, `PHASE11_1`, `PHASE12_1`, `PHASE12_2`) remain bit-for-bit preserved in the repository root.
- **Database & Model Artifacts**: PostgreSQL 18.1 instance and all database migrations (`001` through `007`) remain intact. The FAISS candidate index files (`Backend/models/live_faiss.index`) and metadata files (`Backend/models/live_meta.json`) were preserved without destruction or truncation.

---

## 3. Phase 13 Implementation and Test-File Diff Review

A precise file diff review of the changes introduced in Phase 13 was conducted:

### Modified Files
1. `Backend/app/main.py`:
   - Imported `recommend_router` from `app.api.v1.recommend`.
   - Registered router under prefix `/api/v1` with tag `Recommendations`.
   - Added `EmbeddingService` warmup step during lifespan initialization (`embedder.embed("SkillVerse AI Recommendation Engine Warmup")`).
2. `Backend/src/services/ml.service.js`:
   - Added `callMLToRecommendActivities(studentContext, candidateActivities, topK)` helper.
   - Forwards request to `http://127.0.0.1:8000/api/v1/recommend_activities` with timeout (10000ms), `X-Service-Token` header, and error propagation.
3. `Backend/src/services/roadmap.service.js`:
   - Upgraded `ROADMAP_ENGINE_VERSION` to `v2.0.0-ai-semantic-recommendation`.
   - Replaced pure deterministic sort in `generateRoadmap()` with an asynchronous branch:
     - Formats student gap context and catalog activities into Pydantic schema.
     - Calls `callMLToRecommendActivities()`.
     - Gracefully falls back to deterministic ordering if ML service fails or is unreachable, setting engine version to `'v2.0.0-ai-semantic-recommendation (fallback)'`.
   - Updated `roadmap_recommendations` persistence to serialize `recommendation_metadata` JSONB (breakdown scores, primary driver, semantic relevance, rationale text).
4. `Frontend/src/pages/candidate/CandidateLearning.tsx`:
   - Added `recommendation_metadata` interface typing (`semantic_relevance_pct`, `primary_driver`, `rationale_text`, `scoring_breakdown`).
   - Added AI Match Badge (purple gradient with semantic alignment percentage).
   - Rendered grounded rationale card displaying primary driver and transparency disclaimer: *"Model-assisted recommendation based on your active goals, verified Skill DNA, and curriculum alignment."*
5. `Backend/tests/phase9_1_audit_semantics.test.js`:
   - **Line 325 Modified**: Changed from:
     ```javascript
     assert.equal(res.body.engine_version, 'v1.1.0-deterministic-roadmap');
     ```
     to:
     ```javascript
     assert.ok(res.body.engine_version === 'v1.1.0-deterministic-roadmap' || res.body.engine_version === ROADMAP_ENGINE_VERSION);
     ```

### Untracked Files Introduced in Phase 13
1. `Backend/migrations/007_ai_recommendations_metadata.sql`: DDL for JSONB metadata and GIN indexes.
2. `Backend/app/api/v1/recommend.py`: FastAPI endpoint `POST /api/v1/recommend_activities`.
3. `Backend/tests/test_recommend_activities.py`: 4 unit tests for FastAPI endpoint.
4. `Backend/tests/evaluate_recommendations.py`: Offline evaluation suite with 4 synthetic personas.
5. `Backend/tests/phase13_ai_recommendations.test.js`: 6 integration tests for roadmap AI recommendation.
6. `Frontend/tests/e2e/phase13_ai_recommendations.spec.ts`: 3 Playwright tests for AI recommendation UI.
7. `PHASE13_AI_LEARNING_RECOMMENDATION_ENGINE_REPORT.md`: Milestone summary report.

---

## 4. Status of Previous Baseline Evidence and Test Integrity Audit

### Investigation of Prior Execution Failures
During Phase 13, the trajectory logged several test failures and cancellations. Each was audited for root cause:

1. **`pytest` Invocation Failure**:
   - *Observation*: Initial command `python -m pytest tests/` terminated with exit code 1 (`No module named pytest`).
   - *Audit Finding*: The project's Python virtual environment (`.venv`) does not package `pytest`; it utilizes the Python standard library `unittest` runner. Subsequent tests executed via `python -m unittest discover -s tests -p "test_*.py"` passed completely.
2. **Phase 9 Integration Test Failure (`(fallback)` engine version)**:
   - *Observation*: `phase9_personalized_roadmaps.test.js` failed with assertion `assert.equal(res.body.engine_version, 'v2.0.0-ai-semantic-recommendation')` receiving `'v2.0.0-ai-semantic-recommendation (fallback)'`.
   - *Audit Finding*: When `main.py` was initially updated to register `recommend_router`, the running Uvicorn daemon had not reloaded. Node.js backend received HTTP 404 from FastAPI, correctly invoking the resilient fallback path. Once Uvicorn was restarted, Node.js successfully communicated with FastAPI, returning the full AI engine version.
3. **Phase 13 Integration Test Setup Crash (`TypeError`)**:
   - *Observation*: `phase13_ai_recommendations.test.js` failed in the setup hook with `TypeError: Cannot read properties of undefined (reading 'id')`.
   - *Audit Finding*: In `before()`, the candidate creation helper was written as `c1Id = c1Res.body.candidate.id;`. In the SkillVerse candidate controller, the response schema returns `c1Res.body.candidate_id`. Updating this line to `c1Res.body.candidate_id` immediately resolved the failure.
4. **Offline Evaluation Module Import Failure**:
   - *Observation*: Running `python tests/evaluate_recommendations.py` threw `ModuleNotFoundError: No module named 'app'`.
   - *Audit Finding*: Python script required `PYTHONPATH` set to the `Backend` directory to resolve package imports. Running with `[Environment]::SetEnvironmentVariable('PYTHONPATH', ...)` executed cleanly.

### Audit of `phase9_1_audit_semantics.test.js` Modification
- **Context**: In Phase 9.1, test `C. Recommendation Idempotency & Lifecycle Preservation` asserted line 325: `assert.equal(res.body.engine_version, 'v1.1.0-deterministic-roadmap')`.
- **Phase 13 Change**: The assertion was updated to allow `ROADMAP_ENGINE_VERSION` (`'v2.0.0-ai-semantic-recommendation'`).
- **Audit Verdict**: The change was necessary because `roadmap.service.js` updated the global constant `ROADMAP_ENGINE_VERSION`. However, modifying an audit regression test from an earlier phase to accept new behavior weakens the regression barrier. To prevent silent regressions in future phases, engine version assertions should either parameterize the expected version by test case or verify that legacy roadmaps created under earlier versions retain their historical engine version snapshot.

---

## 5. Actual Model-Assisted Request Trace

The live model-assisted execution trace was verified by issuing authenticated HTTP requests across the complete system architecture:

```
[Browser / CandidateLearning.tsx]
       │
       ▼ HTTP GET /api/roadmap/candidate/:id (Cookie: token)
[Node.js Express Backend / roadmap.service.js]
       │
       │ Extracts Student Context & Gaps from PostgreSQL
       ▼ HTTP POST http://127.0.0.1:8000/api/v1/recommend_activities
         Header: X-Service-Token: skillverse-internal-service-secret-local-dev
         Body: { student_context: {...}, candidate_activities: [...], top_k: 5 }
[FastAPI AI Microservice / recommend.py]
       │
       ├─► Validates X-Service-Token via HMAC constant-time comparison
       ├─► Serializes Student Context & Gaps to natural language prompt
       ├─► Generates 384-dimensional dense L2-normalized vector via cached
       │   SentenceTransformer singleton (`all-MiniLM-L6-v2`)
       ├─► Embeds candidate activity documents
       ├─► Computes Cosine Similarity dot product & clips to [0.0, 1.0]
       ├─► Evaluates Gap Urgency, Difficulty Calibration & Verification Payoff
       ├─► Computes Multi-Factor Convex Combination Ranking Score
       └─► Generates Grounded Explanations with component breakdown
       │
       ▼ HTTP 200 OK Response { recommendations: [...], count: 5 }
[Node.js Express Backend / roadmap.service.js]
       │
       ├─► Persists recommendations to PostgreSQL table `roadmap_recommendations`
       │   Storing JSONB metadata in column `recommendation_metadata`
       └─► Returns HTTP 200 OK with AI badges and explanations
       │
       ▼
[Browser / CandidateLearning.tsx]
       Renders Purple AI Match Badge, Similarity %, Driver & Grounded Rationale Card
```

### Authentication & Boundary Verification
1. **Unauthenticated Access**: `POST /api/v1/recommend_activities` without header returned `HTTP 401 Unauthorized` (`detail: "Unauthorized: Missing internal service token"`).
2. **Invalid Token**: `POST` with `X-Service-Token: invalid-token-12345` returned `HTTP 403 Forbidden` (`detail: "Forbidden: Invalid internal service token"`).
3. **Empty Activity Candidate List**: Returned `HTTP 200 OK` with `count: 0`, `recommendations: []`, and message `"No candidate activities provided"`.
4. **Candidate with Zero Gaps**: Evaluated cleanly, falling back to general career track alignment with default urgency ($0.50$).
5. **Vector Caching**: `EmbeddingService` in `Backend/app/core/embeddings.py` maintains an in-memory singleton. Embeddings were computed in $<15\text{ms}$ without reloading weights from disk.

---

## 6. Ranking Formula Verification

The ranking formula was subjected to independent mathematical and boundary verification:

$$\text{RankingScore} = 0.40 \times \text{Sim} + 0.30 \times \text{GapPriority} + 0.15 \times \text{DiffCalibration} + 0.15 \times \text{VerifPayoff}$$

### Factor Definitions & Bounds
1. **Semantic Similarity ($\text{Sim}$)**:
   - Dot product of L2-normalized embeddings: $\text{Sim} = \mathbf{u} \cdot \mathbf{v}$.
   - Explicitly clipped via `np.clip(raw_sim, 0.0, 1.0)`.
   - Bounds: $[0.0, 1.0]$.
2. **Gap Urgency ($\text{GapPriority}$)**:
   - `development_indicated`: $1.00$ (failed attempt or sub-threshold evidence).
   - `unassessed`: $0.85$ (unproven core requirement).
   - `evidence_rejected`: $0.80$ (rejected submission requiring remediation).
   - `unresolved_requirement`: $0.50$.
   - `evidence_pending`: $0.40$ (under mentor review; avoids duplicate assignment).
   - `evidence_supports_target`: $0.25$ (already verified).
   - Default / no gap match: $0.50$.
   - Bounds: $[0.25, 1.00]$.
3. **Difficulty Calibration ($\text{DiffCalibration}$)**:
   - Heuristic matrix matching student proficiency tier (`foundational`, `intermediate`, `advanced`) against activity difficulty.
   - Exact tier matches yield $1.00$; adjacent tiers yield $0.75 - 0.85$; miscalibrated tiers yield $0.40 - 0.50$.
   - Bounds: $[0.40, 1.00]$.
4. **Verification Payoff ($\text{VerifPayoff}$)**:
   - `assessment` (standardized benchmark yielding verified Skill DNA credit): $1.00$.
   - `practice_project` with explicit verification criteria: $0.90$.
   - `code_challenge`: $0.80$.
   - Unverified exercise: $0.60$.
   - Bounds: $[0.60, 1.00]$.

### Mathematical Properties
- **Convex Combination**: $\sum W = 0.40 + 0.30 + 0.15 + 0.15 = 1.00$.
- **Boundedness**: Because each component $C_i \in [0.0, 1.0]$, the weighted sum $\sum W_i C_i \in [0.0, 1.0]$. Furthermore, `np.clip(ranking_score, 0.0, 1.0)` enforces hard safety bounds.
- **Tie-Breaking**: Python's `list.sort(key=lambda x: x["ranking_score"], reverse=True)` is stable (Timsort), preserving original catalog insertion order on identical scores.
- **Distinction from Hiring Probabilities**: Unlike the LightGBM recruitment matching model (which outputs calibrated candidate-job hiring probabilities), this score represents **educational priority and curriculum relevance**. It does not represent hiring suitability or student pass probability.

---

## 7. Dataset, Label Provenance and Metric Recalculation

### Provenance Audit of Evaluation Benchmark
- **File**: `Backend/tests/evaluate_recommendations.py`.
- **Catalogue Size**: 15 activities (13 technical activities covering Rust, Distributed Systems, Python, FastAPI, PostgreSQL, React, Docker, Kubernetes, Go, Application Security; and 2 negative distractors: Creative Writing, Graphic Design).
- **Cohort Size**: 4 hand-crafted synthetic student personas (`P1_distributed_systems_junior`, `P2_backend_platform_architect`, `P3_systems_software_engineer`, `P4_fullstack_web_architect`).
- **Ground Truth Labels**: Manually assigned by the developer on a 4-point scale ($3 = \text{highly relevant}, 2 = \text{relevant}, 1 = \text{marginally relevant}, 0 = \text{irrelevant}$).
- **Evaluation Validity**: While the benchmark demonstrates that multi-factor semantic ranking outperforms a naive deterministic priority sort on structured curricula, the cohort size ($N=4$) and synthetic ground truth mean that **these metrics reflect internal algorithmic consistency rather than statistically generalized human preference**.

### Independent Metric Recalculation
Running `evaluate_recommendations.py` produced the following exact raw results:

```
Persona: P1_distributed_systems_junior (Target: Distributed Systems & Cloud Engineer)
  Deterministic Top 3: [1, 2, 3]
  AI Model Top 3:      [1, 10, 3]
  [@K=3] Baseline: P=0.667, R=0.500, NDCG=0.862, Cov=50.0% | AI: P=1.000, R=0.750, NDCG=0.959, Cov=75.0%
  [@K=5] Baseline: P=0.600, R=0.750, NDCG=0.878, Cov=75.0% | AI: P=0.600, R=0.750, NDCG=0.905, Cov=100.0%

Persona: P2_backend_platform_architect (Target: Backend Platform & API Architect)
  Deterministic Top 3: [8, 7, 13]
  AI Model Top 3:      [7, 13, 8]
  [@K=3] Baseline: P=1.000, R=0.750, NDCG=0.845, Cov=100.0% | AI: P=1.000, R=0.750, NDCG=1.000, Cov=100.0%
  [@K=5] Baseline: P=0.800, R=1.000, NDCG=0.827, Cov=100.0% | AI: P=0.800, R=1.000, NDCG=0.964, Cov=100.0%

Persona: P3_systems_software_engineer (Target: Low-Latency Systems & Network Engineer)
  Deterministic Top 3: [1, 3, 12]
  AI Model Top 3:      [1, 3, 12]
  [@K=3] Baseline: P=1.000, R=0.600, NDCG=1.000, Cov=100.0% | AI: P=1.000, R=0.600, NDCG=1.000, Cov=100.0%
  [@K=5] Baseline: P=1.000, R=1.000, NDCG=1.000, Cov=100.0% | AI: P=1.000, R=1.000, NDCG=1.000, Cov=100.0%

Persona: P4_fullstack_web_architect (Target: Full-Stack Web & Cloud Developer)
  Deterministic Top 3: [10, 7, 9]
  AI Model Top 3:      [10, 7, 9]
  [@K=3] Baseline: P=1.000, R=0.750, NDCG=1.000, Cov=100.0% | AI: P=1.000, R=0.750, NDCG=1.000, Cov=100.0%
  [@K=5] Baseline: P=0.600, R=0.750, NDCG=0.885, Cov=100.0% | AI: P=0.800, R=1.000, NDCG=0.973, Cov=100.0%
```

---

## 8. Security and Lifecycle Findings

1. **Service Token Protection**: Internal communication between Node.js and FastAPI enforces `X-Service-Token`. Unauthenticated or forged external requests are rejected at the FastAPI boundary with HTTP 401/403.
2. **Cross-Student Isolation**:
   - `roadmap.controller.js` verifies that the authenticated JWT subject matches the student or candidate ID.
   - In `phase13_ai_recommendations.test.js`, test `Student B cannot modify Student A's recommendations` confirmed that cross-student state mutation returns `HTTP 403 Forbidden`.
3. **Recommendation Lifecycle Preservation**:
   - Transitioning an activity from `not_started` $\to$ `in_progress` $\to$ `completed` updates `roadmap_recommendations.status` without altering the persisted `recommendation_metadata` JSONB.
   - The idempotency key prevents duplicate row creation upon repeated roadmap evaluations.
4. **Fallback Behavior**:
   - If the FastAPI microservice is stopped or unreachable, Node.js catches the connection error and executes the deterministic heuristic ordering.
   - The response remains HTTP 200 OK, with `engine_version` explicitly tagged `'v2.0.0-ai-semantic-recommendation (fallback)'`, preventing user-facing breakage.

---

## 9. Migration and Persistence Findings

### Migration 007 Audit
- **File**: `Backend/migrations/007_ai_recommendations_metadata.sql`.
- **DDL Changes**:
  ```sql
  ALTER TABLE roadmap_recommendations 
  ADD COLUMN IF NOT EXISTS recommendation_metadata JSONB DEFAULT '{}'::jsonb;

  ALTER TABLE development_roadmaps
  ADD COLUMN IF NOT EXISTS model_metadata JSONB DEFAULT '{}'::jsonb;

  CREATE INDEX IF NOT EXISTS idx_roadmap_recommendations_metadata_gin 
  ON roadmap_recommendations USING GIN (recommendation_metadata);

  CREATE INDEX IF NOT EXISTS idx_development_roadmaps_model_metadata_gin 
  ON development_roadmaps USING GIN (model_metadata);
  ```
- **Database Verification**:
  - The migration ran safely without locking tables or degrading existing records.
  - Queried PostgreSQL `information_schema.columns`: both `recommendation_metadata` and `model_metadata` exist with data type `jsonb`.
  - Queried `pg_indexes`: both GIN indexes `idx_roadmap_recommendations_metadata_gin` and `idx_development_roadmaps_model_metadata_gin` are registered and valid.

---

## 10. Frontend Integration Findings

The frontend implementation was audited in `Frontend/src/pages/candidate/CandidateLearning.tsx`:

1. **AI Match Badge**: Correctly renders a purple gradient badge displaying the model match percentage (`recommendation_metadata.semantic_relevance_pct` or rounded `ranking_score * 100`).
2. **Grounded Rationale Card**:
   - When metadata is present, a dedicated callout displays:
     - **Primary Driver**: (e.g., *"Directly addresses demonstrated conceptual gap in PostgreSQL"*).
     - **Alignment Percentage**: *"Semantic relevance: 51% content alignment with active goal requirements."*
     - **Calibrated Tier & Verification Impact**: *"Foundational tier calibrated to current proficiency. Direct Skill DNA verification."*
3. **Model Transparency Notice**: Displays a persistent informational disclaimer clarifying that recommendations are model-assisted and grounded in verified Skill DNA and goal requirements.
4. **Responsive Layout**: Validated across Mobile (375px), Tablet (768px), and Desktop (1280px) viewports via Playwright E2E tests, verifying that badge and rationale text wrap without layout clipping.

---

## 11. Exact Fresh Test Commands and Results

All test suites were executed sequentially in the live environment with complete pass counts recorded:

| Suite # | Test Layer | Execution Command | Suites / Specs | Passed | Failed | Exit Code |
|:---:|:---|:---|:---:|:---:|:---:|:---:|
| 1 | **Browser Extension** | `npm test` in `BrowserExtension` | 5 | 19 | 0 | 0 |
| 2 | **Python ML & AI Service** | `python -m unittest discover -s tests -p "test_*.py"` in `Backend` | N/A | 26 | 0 | 0 |
| 3 | **Backend Node.js & DB** | `npm test` in `Backend` | 77 | 190 | 0 | 0 |
| 4 | **Frontend Unit Tests** | `npm test` in `Frontend` | 3 | 15 | 0 | 0 |
| 5 | **Playwright Browser E2E** | `npx playwright test` in `Frontend` | 5 | 36 | 0 | 0 |
| 6 | **Frontend ESLint** | `npm run lint` in `Frontend` | N/A | 0 errors, 0 warnings | 0 | 0 |
| 7 | **Frontend Production Build** | `npm run build` in `Frontend` | N/A | Success (`35.12s`) | 0 | 0 |
| **Total** | **Comprehensive Regression** | **All Automated Test Suites** | **90** | **286** | **0** | **0** |

*Note: In addition to the 286 automated regression tests, the offline evaluation benchmark script (`Backend/tests/evaluate_recommendations.py`) executed independently with 0 errors.*

---

## 12. Corrected Metric Table

The table below clarifies the distinction between **Percentage-Point Deltas** ($\Delta = \text{AI} - \text{Base}$) and **Relative Percentage Gains** ($\text{Rel} = \frac{\Delta}{\text{Base}} \times 100\%$):

| Metric | Deterministic Baseline | AI Recommendation Engine | Absolute Delta ($\Delta$) | Percentage-Point Delta | Relative Gain (%) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Precision@3** | 0.9167 | 1.0000 | +0.0833 | **+8.33 pp** | **+9.09%** (+9.1%) |
| **Recall@3** | 0.6500 | 0.7125 | +0.0625 | **+6.25 pp** | **+9.62%** (+9.6%) |
| **NDCG@3** | 0.9267 | 0.9899 | +0.0631 | **+6.31 pp** | **+6.81%** (+6.8%) |
| **Gap Coverage@3** | 87.5% | 93.8% | +0.0625 | **+6.25 pp** | **+7.14%** (+7.1%) |
| **Precision@5** | 0.7500 | 0.8000 | +0.0500 | **+5.00 pp** | **+6.67%** (+6.7%) |
| **Recall@5** | 0.8750 | 0.9375 | +0.0625 | **+6.25 pp** | **+7.14%** (+7.1%) |
| **NDCG@5** | 0.8975 | 0.9608 | +0.0632 | **+6.32 pp** | **+7.04%** (+7.0%) |
| **Gap Coverage@5** | 93.8% | 100.0% | +0.0625 | **+6.25 pp** | **+6.67%** (+6.7%) |

> [!NOTE]
> The Phase 13 report claimed "+9.1% Precision@3, +9.6% Recall@3, +6.8% NDCG@3". These figures were **relative percentage improvements**, not percentage-point increases. Both metrics are now explicitly disambiguated above.

---

## 13. Known Limitations and Outstanding Defects

1. **Benchmark Cohort Generalization**:
   - The offline evaluation suite evaluates 4 hand-authored personas against 15 curriculum activities with author-assigned relevance ratings.
   - It cannot be interpreted as empirical proof of student learning acceleration or universal generalizability across arbitrary academic tracks without real user engagement telemetry.
2. **Static Heuristic Weights**:
   - Multi-factor weights ($W_{\text{sim}} = 0.40, W_{\text{gap}} = 0.30, W_{\text{calib}} = 0.15, W_{\text{payoff}} = 0.15$) are hard-coded rather than learned from historical student completion rates or feedback.
3. **Historical Regression Test Mutation**:
   - Modifying `phase9_1_audit_semantics.test.js` to accept `v2.0.0-ai-semantic-recommendation` resolved immediate test suite failure, but masked the fact that snapshot engine versioning contracts were modified.
4. **Hugging Face Hub Warning**:
   - The test runner logs `Warning: You are sending unauthenticated requests to the HF Hub. Please set a HF_TOKEN`. While weights are cached locally in the environment, future cold starts without internet connectivity should point to local disk snapshot paths.

---

## 14. Final Status Matrix

| Capability / Verification Area | Audit Method | Status | Notes |
|:---|:---|:---:|:---|
| **SentenceTransformer Pipeline** | Code review, live HTTP trace, PyTorch execution | **VERIFIED** | Locally cached `all-MiniLM-L6-v2` generates 384-d normalized embeddings |
| **Multi-Factor Ranking Formula** | Mathematical analysis, unit test inspection, live curl trace | **VERIFIED** | Convex combination strictly bounded in $[0.0, 1.0]$ with stable sort tie-breaking |
| **Grounded Explanations** | API schema validation, E2E browser inspection | **VERIFIED** | Generates primary driver, similarity %, difficulty tier, and transparency notice |
| **Internal Service Token Auth** | cURL boundary testing (missing, invalid, valid tokens) | **VERIFIED** | HTTP 401 on missing token; HTTP 403 on invalid token |
| **PostgreSQL Persistence & GIN** | SQL query on `information_schema` and `pg_indexes` | **VERIFIED** | `recommendation_metadata` JSONB and GIN indexes verified in live DB |
| **Deterministic Fallback Path** | Backend unit test, simulated microservice failure | **VERIFIED** | Returns HTTP 200 with `v2.0.0-ai-semantic-recommendation (fallback)` |
| **Offline Evaluation Reproducibility** | Clean script re-execution (`evaluate_recommendations.py`) | **VERIFIED** | Output matched reported baseline and AI metrics exactly |
| **Metric Delta Disambiguation** | Mathematical recomputation | **VERIFIED** | Resolved relative gains (+9.1%) vs percentage-point gains (+8.33 pp) |
| **Test Suite Cleanliness & Pass Count** | Fresh sequential runs across 5 test layers | **VERIFIED** | **286 passing automated tests** (0 failed, 0 cancelled, 0 skipped) |
| **Prior Execution Failure Analysis** | Audit of transcript logs and code modifications | **VERIFIED** | Traced to missing `pytest`, stale daemon, and `candidate_id` response key |
| **Real User Generalization** | Methodology and provenance review | **OBSERVED** | Benchmark is synthetic ($N=4$ personas); real-world efficacy is unverified |

---
*End of Phase 13.1 Independent Audit Report.*
