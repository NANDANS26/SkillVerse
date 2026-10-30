# SKILLVERSE PHASE 8 — EVIDENCE-BACKED SKILL DNA ENGINE AND EXPLAINABLE COMPETENCY INTELLIGENCE REPORT

**Execution Date:** October 27, 2026  
**Platform Version:** SkillVerse 8.0.0-MVP  
**Repository Branch:** `main` (commit baseline `56e3ef9c59f08aaef7d41fcb8755545af70ecbb7`)  
**Primary Database:** PostgreSQL 18.0 (sole relational datastore on port 5432)  
**AI Intelligence Microservice:** Python 3.11 + FastAPI + SentenceTransformer (`all-MiniLM-L6-v2`) + FAISS + LightGBM  
**Backend API:** Node.js v20.19.5 + Express (port 3000)  
**Frontend Client:** React 18 + TypeScript + Vite + Tailwind CSS (port 5173)  
**Test Suite Coverage:** 170 passing tests (118 Node.js + 22 Python + 15 Frontend Unit + 15 Playwright Browser E2E)

---

## 1. Executive Summary

Phase 8 establishes SkillVerse's flagship innovation: the **Evidence-Backed Skill DNA Engine**. Prior to Phase 8, candidate skills were self-reported keywords stored as basic JSON strings. While semantic vector retrieval and LightGBM ranking matched candidates on textual overlap, the system lacked objective ground-truth proof of engineering capability.

In Phase 8, SkillVerse transitions from arbitrary keyword acceptance to an evidence-backed competency graph:
1. **Mathematical Evidence Formulation:** Ground-truth competence is measured through multiple independent evidence sources. Self-reported claims are strictly capped at 0.350 confidence, while verified standardized assessments achieve 0.850 and faculty mentorship code evaluations achieve 0.750.
2. **Standardized Technical Benchmark Testing:** Timed, versioned programming and architectural benchmark assessments evaluate real skills. Crucially, **server-side answer keys are strictly withheld** from client responses, eliminating client-side inspection vulnerabilities.
3. **Faculty Verification Queue:** Enforces strict 403 Forbidden boundaries where only assigned faculty mentors can inspect mentee code repositories, record advisory notes, and elevate evidence to verified status.
4. **Transparent Explainability Across Six Roles:** The candidate matching pipeline was enriched with `skill_dna_summary` without breaking LightGBM feature vectors. Recruiters now observe verified skill proofs versus self-reported claims directly in candidate cards.
5. **Zero External API Cost:** The entire calculation engine is deterministic and runs locally on PostgreSQL and Node.js without calling paid external LLMs (no Gemini, OpenAI, or external dependencies).

---

## 2. Existing Architecture Baseline

SkillVerse operates on a microservice architecture verified in Phases 5.2 through 7.1:
* **Relational Persistence:** Single PostgreSQL 18.0 database (`postgres` user, port 5432).
* **Node.js Express Backend:** Handles authentication, RBAC across six canonical roles (`student`, `college_admin`, `faculty`, `company_admin`, `recruiter`, `super_admin`), transactional outbox queue, and RESTful APIs.
* **FastAPI AI Microservice:** Runs on port 8000; performs SentenceTransformer vector embeddings (384-dimensional dense vectors), dual-store candidate FAISS index retrieval (5,000 synthetic benchmark records + dynamic live candidate store), and LightGBM reranking.
* **Transactional Outbox Queue:** `indexing_queue` table ensures zero data loss between PostgreSQL profile updates and asynchronous FAISS index updates.

---

## 3. Skill DNA Definition & Competency Model

Skill DNA is a multi-dimensional, explainable representation of candidate capability. Rather than collapsing a candidate's profile into an opaque single number, Skill DNA decomposes competency into discrete, verifiable dimensions:
* **Canonical Skill Identification:** Every competency maps to an authoritative, taxonomy-backed slug (e.g., `rust`, `distributed-systems`).
* **Proficiency Tier:** Categorized into `Beginner` (< 50% score), `Intermediate` (50–74%), `Advanced` (75–89%), and `Expert` (>= 90%).
* **Evidence Confidence ($C$):** Continuous metric in range $[0.000, 1.000]$ quantifying statistical certainty based on provenance.
* **Verification Status:** Tri-state lifecycle:
  * `verified`: Supported by passed standardized assessment, approved faculty review, or verified repository proof.
  * `pending_review`: Code submission undergoing mentor evaluation.
  * `self_reported`: Profile claim lacking formal proof (confidence strictly capped).
  * `rejected`: Plagiarized or substandard submission (confidence reset to 0.000).
* **Domain Coverage & Recency:** Measures disciplinary breadth and recency (days elapsed since last validated proof).

---

## 4. Canonical Skill Taxonomy Implementation

Implemented via PostgreSQL Migration `004_skill_dna_evidence_and_assessments.sql`:

```sql
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Seeded Canonical Skills
| Slug | Canonical Name | Category | Aliases |
| :--- | :--- | :--- | :--- |
| `rust` | Rust | Systems | `["rustlang", "cargo"]` |
| `distributed-systems` | Distributed Systems | Backend | `["distributed computing", "consensus", "raft"]` |
| `python` | Python | Language | `["py", "python3"]` |
| `fastapi` | FastAPI | Framework | `["fast-api", "asgi"]` |
| `postgresql` | PostgreSQL | Database | `["postgres", "psql"]` |
| `react` | React | Frontend | `["reactjs", "react.js"]` |
| `docker` | Docker | DevOps | `["containerization", "containers"]` |
| `kubernetes` | Kubernetes | Infrastructure | `["k8s"]` |
| `go` | Go | Language | `["golang"]` |
| `security` | Cybersecurity & AppSec | Security | `["infosec", "appsec"]` |

---

## 5. Evidence Provenance & Lifecycle

All competency claims are recorded in the `skill_evidence` table with explicit provenance tracking:

```sql
CREATE TABLE IF NOT EXISTS skill_evidence (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'self_reported', 'resume_extracted', 'project_submission', 'assessment_result', 'faculty_review'
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  source_reference VARCHAR(500) NULL,
  review_status VARCHAR(50) NOT NULL DEFAULT 'unreviewed',
  reviewer_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  review_feedback TEXT NULL,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Provenance Weight Matrix
| Source Type | Review Status | Assigned Confidence | Rationale |
| :--- | :--- | :---: | :--- |
| `assessment_result` | `verified` | **0.850** | Passed standardized server-graded benchmark test. |
| `faculty_review` | `verified` | **0.750** | Verified by assigned mentor in academic roster. |
| `project_submission` | `verified` | **0.750** | Repository code artifacts inspected and approved. |
| `project_submission` | `pending_review` | **0.350** | Code submitted; awaiting faculty advisory review. |
| `self_reported` | `unreviewed` | **0.350 (Capped)** | Claimed on profile without empirical proof. |
| `project_submission` | `rejected` | **0.000** | Failed review or non-functional submission. |

---

## 6. Standardized Assessment Architecture

Standardized assessments provide empirical, objective proof of programming proficiency:

```sql
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
```

### Seeded Assessments Catalog
1. **Rust Systems Engineering Assessment (`rust-systems-foundations`):**
   * *Target Skill:* `rust` (Systems)
   * *Scope:* Ownership semantics, borrow checker rules, lifetimes, zero-cost abstractions, error propagation.
   * *Threshold:* 60.0% (3/5 questions correct).
2. **Distributed Consensus & Fault Tolerance Assessment (`distributed-systems-consensus`):**
   * *Target Skill:* `distributed-systems` (Backend)
   * *Scope:* CAP theorem tradeoffs, state machine replication, leader election, Raft consensus logs.
   * *Threshold:* 60.0%.
3. **Python Backend & Async Architecture Assessment (`python-backend-concurrency`):**
   * *Target Skill:* `python` (Language)
   * *Scope:* Asyncio event loop lifecycles, coroutine concurrency, ASGI request dispatching, generators.
   * *Threshold:* 60.0%.

---

## 7. Anti-Cheating & Answer Key Security

To ensure enterprise-grade test integrity and prevent client-side answer sniffing:
1. **Answer Key Withholding:** The query in `getAssessmentBySlug(slug)` explicitly omits `answer_keys_json`:
   ```javascript
   SELECT a.id, a.slug, a.title, a.description, a.version,
          a.time_limit_minutes, a.pass_threshold, a.questions_json, ...
   -- Note: answer_keys_json is strictly excluded
   ```
2. **Question Sanitization:** Question choice objects (`choices`) contain only identifier keys (`a`, `b`, `c`, `d`) and text prompts. No boolean flags (`is_correct`) or metadata are ever transmitted to the client.
3. **Server-Side Grading:** Responses are validated in `submitAssessmentAttempt()`:
   * The server loads `answer_keys_json` privately from PostgreSQL.
   * Answers are normalized, matched, and graded server-side.
   * An immutable attempt record is written to `assessment_attempts`.
   * Only upon achieving $\ge \text{pass\_threshold}$ is a verified `skill_evidence` row created with 0.850 confidence.

---

## 8. Skill DNA Calculation Engine Implementation

The deterministic engine (`Backend/src/services/skill_dna.service.js`, version `v1.0.0-deterministic`) formulates candidate competency mathematically without external AI calls:

### Confidence Combination Formula
When a candidate presents $n$ valid evidence records for a single skill:
$$C = 1 - \prod_{i=1}^n (1 - c_i)$$
Where $c_i = \min(\text{weight}_i, 0.95)$.

**Enforcement of Upper Bounds:**
If all evidence items are `self_reported` or `unreviewed`, the calculation engine enforces an absolute ceiling:
$$C_{\text{unverified}} = \min(C, 0.350)$$
This mathematical constraint ensures that candidates claiming dozens of self-reported skills cannot artificially inflate their Skill DNA confidence without passing assessments or receiving faculty endorsement.

### Proficiency Tier Assignment
* If supported by an assessment attempt:
  * $\text{Score} \ge 90\% \implies \text{Expert}$
  * $\text{Score} \ge 75\% \implies \text{Advanced}$
  * $\text{Score} \ge 50\% \implies \text{Intermediate}$
  * $\text{Score} < 50\% \implies \text{Beginner}$
* If supported by verified project/faculty evidence without score:
  * Tier defaults to `Intermediate` or `Advanced` based on cumulative evidence count.

---

## 9. Candidate Matching Integration

In `Backend/src/controllers/jobs.controller.js`, the candidate matching workflow preserves the LightGBM machine learning contract while adding explainable competency metadata:

```javascript
// Enrich candidate matches with explainable Skill DNA summary
cand.skill_dna_summary = {
  verified_skills_count: dna.overview.verified_skills_count,
  total_skills_count: dna.overview.total_skills_tracked,
  avg_confidence: Math.round(dna.overview.average_confidence * 100),
  top_skills: dna.skills.map(s => ({
    slug: s.slug,
    name: s.name,
    proficiency_tier: s.proficiency_tier,
    confidence: Math.round(s.confidence * 100),
    verification_status: s.verification_status,
    verified: s.verification_status === 'verified'
  }))
};
```
* **ML Model Integrity:** Features fed to LightGBM (`skill_overlap`, `embedding_sim`, `exp_match`) and FAISS vector retrieval remain untouched.
* **Explainability:** Recruiters see an objective breakdown showing which matched skills are backed by benchmark tests versus self-reported text.

---

## 10. Six-Role Interface Delivery

| Role | Frontend Route / Component | Phase 8 Delivery |
| :--- | :--- | :--- |
| **Student** | `/student/skill-dna`<br>[`CandidateSkillDNA.tsx`](file:///D:/NANDAN.S/ENGINEERING/HACKATHONS/portfolio/SkillVerse/Frontend/src/pages/candidate/CandidateSkillDNA.tsx) | Multi-dimensional competency radar, KPI overview (verified ratio, average confidence), evidence cards with provenance badges, and project evidence submission modal. |
| **Student** | `/student/assessments`<br>[`CandidateAssessments.tsx`](file:///D:/NANDAN.S/ENGINEERING/HACKATHONS/portfolio/SkillVerse/Frontend/src/pages/candidate/CandidateAssessments.tsx) | Technical assessment catalog, past attempts history table, and live interactive test session with countdown timer, single-choice options, and instant server-graded feedback. |
| **Faculty** | `/faculty/students`<br>[`FacultyStudents.tsx`](file:///D:/NANDAN.S/ENGINEERING/HACKATHONS/portfolio/SkillVerse/Frontend/src/pages/faculty/FacultyStudents.tsx) | Added "Skill Evidence Queue" tab to review pending mentee submissions with GitHub inspection link, review decision buttons (Verify / Reject), and advisory feedback modal. |
| **Recruiter** | `/recruiter/job/:id/matches`<br>[`CandidateMatches.tsx`](file:///D:/NANDAN.S/ENGINEERING/HACKATHONS/portfolio/SkillVerse/Frontend/src/pages/recruiter/CandidateMatches.tsx) | Enriched candidate cards with `Skill DNA Intelligence` badges displaying count of verified skills and distinct tags for verified vs. self-reported claims. |
| **College Admin** | `/college/dashboard`, `/college/students` | Derives institutional talent verification ratios from PostgreSQL enrollments. |
| **Super Admin** | `/admin` | Tracks platform-wide verified competency KPIs and evidence audit records. |

---

## 11. Database Migration & Schema Changes

* Migration file: [`Backend/migrations/004_skill_dna_evidence_and_assessments.sql`](file:///D:/NANDAN.S/ENGINEERING/HACKATHONS/portfolio/SkillVerse/Backend/migrations/004_skill_dna_evidence_and_assessments.sql).
* Applied via: `node src/db/migrate.js`.
* Target Engine: PostgreSQL 18.0.
* Tables created: `skills`, `assessments`, `skill_evidence`, `assessment_attempts`.
* Foreign key cascades enforce relational integrity with existing `users` and `candidates` tables.

---

## 12. Test Execution & Results

### Automated Test Matrix
| Test Suite | Environment | Total | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phase 8 Skill DNA Engine** | Node.js Test Runner | 13 | 13 | 0 | **100% PASS** |
| **Node.js Integration Regression** | Node.js Test Runner | 118 | 118 | 0 | **100% PASS** |
| **Python ML & Index Durability** | Python 3.11 `unittest` | 22 | 22 | 0 | **100% PASS** |
| **Frontend Unit & Route Helpers** | Node.js Test Runner | 15 | 15 | 0 | **100% PASS** |
| **Playwright Browser E2E Workflows**| Chromium Headless | 15 | 15 | 0 | **100% PASS** |
| **Frontend TypeScript Build** | `tsc && vite build` | — | Built in 20.4s | 0 | **SUCCESS** |
| **Frontend ESLint** | `eslint . --max-warnings 0` | — | 0 warnings | 0 | **SUCCESS** |
| **Total Automated Tests** | Full Stack Suite | **170** | **170** | **0** | **100% PASS** |

### Verified Test Assertions in `phase8_skill_dna_engine.test.js`:
1. Canonical skill taxonomy retrieval and aliases resolution.
2. Standardized assessment listing with question counts.
3. Anti-cheating answer key withholding (strictly omitted from responses).
4. Server-side attempt grading and auto-generation of verified evidence with 0.850 confidence.
5. Inadequate score handling (fails attempt, suppresses verified evidence).
6. Candidate project code evidence submission (defaults to pending_review, 0.350 confidence).
7. Skill DNA calculation with combined verified assessment and pending evidence.
8. Assigned faculty visibility of pending mentee evidence.
9. 403 Forbidden enforcement on unassigned faculty review attempts.
10. Assigned faculty verification approval elevating confidence to 0.750.
11. Zero confidence and empty tracking for candidates with no evidence.
12. Self-reported skills confidence capped at 0.350.
13. Plagiarized / rejected submissions assigned 0.000 confidence and marked as rejected.

---

## 13. Security & Privacy Review

1. **Authentication & Authorization:** All Skill DNA endpoints enforce JWT authentication and RBAC checks (`requireRole('student')` for taking assessments, `requireRole('faculty')` for reviewing evidence).
2. **Institutional Isolation:** Faculty members can only query or verify evidence for students assigned to their mentorship roster in `faculty_student_assignments`. Unassigned faculty receive 403 Forbidden.
3. **Cheating Prevention:** Candidates never receive `answer_keys_json`. All scoring occurs in an isolated server-side transaction.
4. **Credential Privacy:** Password hashes are strictly omitted from super admin directory endpoints.

---

## 14. Limitations & Known Constraints

1. **Static Assessment Item Pool:** Phase 8 seeds three canonical technical assessments (`rust`, `distributed-systems`, `python`). Dynamic question generation or CAT (Computer Adaptive Testing) can be added in future iterations.
2. **Manual Faculty Grading for Non-Code Essays:** The current evidence review modal accepts faculty acceptance/rejection and notes; automated automated static analysis of code repos (e.g., SonarQube integration) is not yet bundled.
3. **LightGBM Benchmark Independence:** The static FAISS benchmark (5,000 synthetic records) remains intact and does not reflect dynamic candidate Skill DNA; live mode candidate queries dynamically utilize the PostgreSQL-backed Skill DNA engine.

---

## 15. Verification Commands & Reproduction Steps

To independently verify the Phase 8 delivery in a native terminal:

```bash
# 1. Run the Phase 8 Skill DNA Engine Test Suite
cd SkillVerse/Backend
node --test tests/phase8_skill_dna_engine.test.js

# 2. Run the Full Backend Test Suite (118 tests)
npm test

# 3. Run the Python AI Intelligence Test Suite (22 tests)
& ".venv/Scripts/python.exe" -m unittest discover -s tests -p "test_*.py"

# 4. Run Frontend Unit Tests (15 tests)
cd ../Frontend
npm test -- --run

# 5. Run Playwright Browser E2E Workflows (15 tests)
npx playwright test

# 6. Verify Production TypeScript Build and Lint
npm run lint
npm run build
```

---

## 16. Conclusion & Next Phase Readiness

SkillVerse Phase 8 has successfully delivered an **Evidence-Backed Skill DNA Engine and Explainable Competency Intelligence** platform. Unverified keywords are replaced by mathematically grounded, provenance-tracked capability profiles. With 170 tests passing, zero regression failures, complete preservation of existing reports and benchmark models, and functional UI across all six roles, the application is operational and verified.

*Stopping execution as directed. No subsequent phase has been started.*
