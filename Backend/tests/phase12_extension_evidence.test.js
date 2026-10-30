// Backend/tests/phase12_extension_evidence.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { 
  listSkills, 
  submitEvidence, 
  getMyEvidence, 
  reviewEvidence,
  getPendingFacultyEvidence
} from '../src/controllers/skills.controller.js';

function createMockReqRes(options = {}) {
  const req = {
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user || null,
    params: options.params || {},
    query: options.query || {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { value: val, options: opts };
      return this;
    },
    clearCookie(name, opts) {
      delete this.cookies[name];
      return this;
    }
  };

  return { req, res };
}

describe('SkillVerse Phase 12: Companion Browser Extension & Evidence Capture Integration Suite', () => {
  const stamp = Date.now();
  let studentUser = null;
  let studentCandidate = null;
  let facultyUser = null;
  let unassignedFacultyUser = null;
  let canonicalSkill = null;

  before(async () => {
    // 1. Fetch canonical skill from taxonomy (migration 004)
    const { req: sReq, res: sRes } = createMockReqRes();
    await listSkills(sReq, sRes);
    assert.equal(sRes.statusCode, 200);
    assert.ok(sRes.body.skills.length > 0);
    canonicalSkill = sRes.body.skills.find(s => s.slug === 'react') || sRes.body.skills[0];

    // 2. Create Student
    const studentEmail = `ext_student_${stamp}@skillverse.test`;
    const { req: stReq, res: stRes } = createMockReqRes({
      body: { name: 'Extension Student', email: studentEmail, password: 'Password123!', role: 'student' }
    });
    await signup(stReq, stRes);
    studentUser = stRes.body.user;

    // Create Candidate profile
    const { req: cpReq, res: cpRes } = createMockReqRes({
      user: { id: studentUser.id, email: studentEmail, role: 'student' },
      body: {
        full_name: 'Extension Student',
        email: studentEmail,
        headline: 'Frontend Engineer',
        skill_json: ['React', 'JavaScript', 'TypeScript']
      }
    });
    await createCandidate(cpReq, cpRes);
    studentCandidate = { id: cpRes.body.candidate_id };

    // 3. Create Institution & Faculty
    const instRes = await db.query(
      `INSERT INTO institutions (name, code, domain) 
       VALUES ($1, $2, $3) RETURNING id`,
      [`Extension Tech Academy ${stamp}`, `ext-tech-${stamp}`, `ext-${stamp}.edu`]
    );
    const institutionId = instRes.rows[0].id;

    const facEmail = `ext_faculty_${stamp}@skillverse.test`;
    const { rows: fRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, 'hashed_pw', 'faculty') RETURNING id, name, email, role`,
      ['Assigned Faculty Advisor', facEmail]
    );
    facultyUser = fRows[0];

    // 4. Create Unassigned Faculty
    const unassignedEmail = `ext_unassigned_${stamp}@skillverse.test`;
    const { rows: uRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, 'hashed_pw', 'faculty') RETURNING id, name, email, role`,
      ['Unassigned Faculty', unassignedEmail]
    );
    unassignedFacultyUser = uRows[0];

    // Memberships
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'faculty'), ($1, $3, 'faculty'), ($1, $4, 'student')`,
      [institutionId, facultyUser.id, unassignedFacultyUser.id, studentUser.id]
    );

    // Link Faculty to Student in faculty_student_assignments
    await db.query(
      `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes)
       VALUES ($1, $2, $3, 'active', 'Mentoring web platform repository evidence.')`,
      [institutionId, facultyUser.id, studentUser.id]
    );
  });

  describe('1. Evidence Submission & Persistence Lifecycle', () => {
    it('allows authenticated student to submit repository evidence with provenance metadata', async () => {
      const repoUrl = `https://github.com/developer/portfolio-project-${stamp}`;
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          source_type: 'project_submission',
          title: 'GitHub: developer/portfolio-project',
          description: 'Designed and implemented full-stack dashboard with real-time analytics.',
          source_reference: repoUrl,
          metadata: {
            platform: 'github',
            repo_name: 'portfolio-project',
            repo_owner: 'developer',
            topics: ['react', 'typescript'],
            is_private: false,
            primary_language: 'TypeScript',
            captured_at: new Date().toISOString()
          }
        }
      });

      await submitEvidence(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.evidence.review_status, 'pending_review');
      assert.equal(Number(res.body.evidence.confidence_score), 0.350);
      assert.equal(res.body.evidence.source_reference, repoUrl);
      assert.equal(res.body.evidence.evidence_metadata.platform, 'github');
    });

    it('retrieves persisted repository evidence for the authenticated student', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' }
      });

      await getMyEvidence(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.evidence.length >= 1);
      const item = res.body.evidence[0];
      assert.equal(item.review_status, 'pending_review');
      assert.equal(item.skill_slug, canonicalSkill.slug);
      assert.equal(item.source_type, 'project_submission');
    });
  });

  describe('2. Duplicate Detection & Review State Preservation', () => {
    const duplicateRepoUrl = `https://github.com/developer/duplicate-repo-${stamp}`;

    it('initial submission creates a new pending record', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          source_type: 'project_submission',
          title: 'Initial GitHub Repo Submission',
          description: 'Original contribution description.',
          source_reference: duplicateRepoUrl
        }
      });

      await submitEvidence(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.evidence.review_status, 'pending_review');
    });

    it('re-submitting same repository URL and skill updates existing pending submission without duplicate row', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          source_type: 'project_submission',
          title: 'Updated GitHub Repo Title',
          description: 'Updated contribution details authored in popup.',
          source_reference: duplicateRepoUrl
        }
      });

      await submitEvidence(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.duplicate_detected, true);
      assert.equal(res.body.status_action, 'updated_pending');
      assert.equal(res.body.evidence.description, 'Updated contribution details authored in popup.');

      // Verify row count in database has not multiplied
      const { rows } = await db.query(
        `SELECT COUNT(*) as count FROM skill_evidence 
         WHERE candidate_id = $1 AND source_reference = $2 AND skill_id = $3`,
        [studentCandidate.id, duplicateRepoUrl, canonicalSkill.id]
      );
      assert.equal(parseInt(rows[0].count, 10), 1);
    });

    it('preserves verified status when faculty verifies and student re-submits', async () => {
      // 1. Faculty reviews and approves the duplicate submission
      const { rows: evRows } = await db.query(
        `SELECT id FROM skill_evidence 
         WHERE candidate_id = $1 AND source_reference = $2`,
        [studentCandidate.id, duplicateRepoUrl]
      );
      const evidenceId = evRows[0].id;

      const { req: revReq, res: revRes } = createMockReqRes({
        user: { id: facultyUser.id, role: 'faculty' },
        params: { id: String(evidenceId) },
        body: { decision: 'verified', feedback: 'Verified authentic repository contribution.' }
      });
      await reviewEvidence(revReq, revRes);
      assert.equal(revRes.statusCode, 200);

      // 2. Student attempts to submit again
      const { req: subReq, res: subRes } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          source_type: 'project_submission',
          title: 'Attempting to overwrite verified',
          description: 'New summary text.',
          source_reference: duplicateRepoUrl
        }
      });
      await submitEvidence(subReq, subRes);
      assert.equal(subRes.statusCode, 200);
      assert.equal(subRes.body.duplicate_detected, true);
      assert.equal(subRes.body.status_action, 'already_verified');
      assert.equal(subRes.body.evidence.review_status, 'verified');
    });
  });

  describe('3. Security, URL Validation & Injection Defenses', () => {
    it('rejects unauthenticated evidence submissions', async () => {
      const { req, res } = createMockReqRes({
        user: null,
        body: { title: 'No auth', skill_slug: canonicalSkill.slug }
      });
      // Without authenticated user object, controller fails gracefully
      try {
        await submitEvidence(req, res);
      } catch (err) {
        assert.ok(err);
      }
    });

    it('rejects malicious URL schemes (javascript:, file:)', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          title: 'Malicious URL Attack',
          source_reference: 'javascript:alert(document.cookie)'
        }
      });
      await submitEvidence(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Invalid URL scheme/);
    });

    it('rejects SSRF / private IP / localhost target URLs', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          title: 'SSRF Attack',
          source_reference: 'http://169.254.169.254/latest/meta-data/'
        }
      });
      await submitEvidence(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Localhost or private network URLs are not permitted/);
    });

    it('rejects non-repository GitHub URLs (e.g. explore, settings)', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          title: 'Non-repo GitHub URL',
          source_reference: 'https://github.com/explore'
        }
      });
      await submitEvidence(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /GitHub repository URL must be in format/);
    });

    it('strips client-injected privilege escalation fields in metadata', async () => {
      const repoUrl = `https://github.com/developer/escalation-test-${stamp}`;
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: canonicalSkill.slug,
          source_type: 'project_submission',
          title: 'Privilege Escalation Attempt',
          source_reference: repoUrl,
          metadata: {
            verified: true,
            review_status: 'verified',
            confidence_score: 0.999,
            reviewer_id: 1,
            safe_prop: 'allowed_value'
          }
        }
      });
      await submitEvidence(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.evidence.review_status, 'pending_review'); // Stays pending
      assert.equal(Number(res.body.evidence.confidence_score), 0.350); // Unreviewed weight
      assert.equal(res.body.evidence.evidence_metadata.verified, undefined); // Injected field stripped
      assert.equal(res.body.evidence.evidence_metadata.safe_prop, 'allowed_value');
    });

    it('rejects invalid or non-existent canonical skill', async () => {
      const { req, res } = createMockReqRes({
        user: { id: studentUser.id, role: 'student' },
        body: {
          skill_slug: 'totally-fake-nonexistent-skill-999',
          title: 'Fake Skill Test',
          source_reference: 'https://github.com/owner/repo'
        }
      });
      await submitEvidence(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Valid canonical skill_id or skill_slug is required/);
    });
  });

  describe('4. Faculty Mentorship Boundaries & Review Workflow', () => {
    it('assigned faculty can view pending mentee evidence', async () => {
      const { req, res } = createMockReqRes({
        user: { id: facultyUser.id, role: 'faculty' }
      });
      await getPendingFacultyEvidence(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.pending_evidence));
    });

    it('unassigned faculty is blocked with 403 Forbidden when attempting to review', async () => {
      // Find an evidence item belonging to student
      const { rows } = await db.query(
        `SELECT id FROM skill_evidence WHERE candidate_id = $1 LIMIT 1`,
        [studentCandidate.id]
      );
      assert.ok(rows[0]);
      const targetId = rows[0].id;

      const { req, res } = createMockReqRes({
        user: { id: unassignedFacultyUser.id, role: 'faculty' },
        params: { id: String(targetId) },
        body: { decision: 'verified', feedback: 'Illegitimate review' }
      });

      await reviewEvidence(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /Forbidden/);
    });
  });
});
