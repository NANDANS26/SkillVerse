// Backend/tests/phase8_skill_dna_engine.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { 
  listSkills, 
  getMySkillDNA, 
  getCandidateSkillDNAById, 
  submitEvidence, 
  getPendingFacultyEvidence, 
  reviewEvidence 
} from '../src/controllers/skills.controller.js';
import { 
  listAssessments, 
  getAssessment, 
  submitAttempt, 
  getMyAttempts 
} from '../src/controllers/assessments.controller.js';
import { calculateCandidateSkillDNA } from '../src/services/skill_dna.service.js';

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

describe('SkillVerse Phase 8: Evidence-Backed Skill DNA Engine & Assessment Architecture', () => {
  const timestamp = Date.now();
  let studentUser;
  let candidateId;
  let facultyUser;
  let unassignedFacultyUser;
  let institutionId;

  before(async () => {
    // 1. Setup Student User
    const { req: sReq, res: sRes } = createMockReqRes({
      body: {
        email: `phase8_student_${timestamp}@skillverse.test`,
        password: 'Password123!',
        name: 'Phase8 Student',
        role: 'student'
      }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    // Create Candidate Profile for Student
    const { req: cpReq, res: cpRes } = createMockReqRes({
      user: studentUser,
      body: {
        headline: 'Distributed Systems & Rust Engineer',
        experience_years: 2.5,
        skill_json: ['Rust', 'Distributed Systems', 'Python'],
        resume_text: 'Experienced in developing low-latency distributed systems and async network protocols.'
      }
    });
    await createCandidate(cpReq, cpRes);
    candidateId = cpRes.body.candidate_id;

    // 2. Setup Faculty User & Institution directly in DB
    const { rows: fRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      ['Dr. Turing', `phase8_faculty_${timestamp}@apex.edu`]
    );
    facultyUser = fRows[0];

    // Setup Unassigned Faculty User directly in DB
    const { rows: ufRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      ['Dr. Strachey', `phase8_unassigned_${timestamp}@apex.edu`]
    );
    unassignedFacultyUser = ufRows[0];

    // Create Institution & Memberships
    const instRes = await db.query(
      `INSERT INTO institutions (name, code, domain) 
       VALUES ($1, $2, $3) RETURNING id`,
      [`Apex Institute of Tech ${timestamp}`, `apex-tech-${timestamp}`, `apex-${timestamp}.edu`]
    );
    institutionId = instRes.rows[0].id;

    // Add faculty to institution
    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'faculty'), ($1, $3, 'faculty'), ($1, $4, 'student')`,
      [institutionId, facultyUser.id, unassignedFacultyUser.id, studentUser.id]
    );

    // Assign faculty to student in faculty_student_assignments
    await db.query(
      `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes)
       VALUES ($1, $2, $3, 'active', 'Mentoring distributed consensus project.')`,
      [institutionId, facultyUser.id, studentUser.id]
    );
  });

  describe('1. Canonical Skill Taxonomy', () => {
    it('should retrieve canonical skills seeded in migration 004', async () => {
      const { req, res } = createMockReqRes();
      await listSkills(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.skills));
      assert.ok(res.body.skills.length >= 10);

      const slugs = res.body.skills.map(s => s.slug);
      assert.ok(slugs.includes('rust'), 'taxonomy must contain rust');
      assert.ok(slugs.includes('distributed-systems'), 'taxonomy must contain distributed-systems');
      assert.ok(slugs.includes('python'), 'taxonomy must contain python');
    });
  });

  describe('2. Standardized Assessment Architecture & Security', () => {
    it('should list available technical assessments with questions count', async () => {
      const { req, res } = createMockReqRes();
      await listAssessments(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.assessments));
      assert.ok(res.body.assessments.length >= 3);

      const rustAsm = res.body.assessments.find(a => a.slug === 'rust-systems-foundations');
      assert.ok(rustAsm);
      assert.equal(rustAsm.skill_slug, 'rust');
      assert.equal(rustAsm.passing_score, 60);
    });

    it('SECURITY: should withhold server answer keys when candidate fetches assessment', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'rust-systems-foundations' }
      });
      await getAssessment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.questions));
      assert.ok(res.body.questions.length >= 3);

      // Verify answer_keys_json or answers are NOT exposed
      assert.equal(res.body.answer_keys, undefined, 'answer_keys must not be in response');
      assert.equal(res.body.assessment.answer_keys_json, undefined, 'answer_keys_json must be omitted');

      // Verify question choices do not expose correct answer flags
      res.body.questions.forEach(q => {
        assert.equal(q.correct_answer, undefined);
        assert.equal(q.answer, undefined);
        assert.equal(q.answer_key, undefined);
      });
    });

    it('should grade assessment attempt server-side and issue verified evidence on passing score', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'rust-systems-foundations' },
        body: {
          answers: {
            q1: 'b', // correct
            q2: 'a', // correct
            q3: 'b', // correct
            q4: 'b', // correct
            q5: 'b'  // correct
          }
        }
      });
      await submitAttempt(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.passed, true);
      assert.equal(res.body.score, 100);
      assert.ok(res.body.evidence_id, 'must return generated verified evidence ID');
      assert.equal(res.body.confidence, 0.85);

      // Verify attempt is recorded in history
      const { req: hReq, res: hRes } = createMockReqRes({ user: studentUser });
      await getMyAttempts(hReq, hRes);
      assert.equal(hRes.statusCode, 200);
      assert.ok(hRes.body.attempts.some(a => a.skill_slug === 'rust' && a.passed === true));
    });

    it('should correctly fail an attempt with insufficient score without granting verified evidence', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'distributed-systems-consensus' },
        body: {
          answers: {
            q1: 'd', // incorrect
            q2: 'd', // incorrect
            q3: 'd', // incorrect
            q4: 'd', // incorrect
            q5: 'd'  // incorrect
          }
        }
      });
      await submitAttempt(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.passed, false);
      assert.equal(res.body.score, 0);
      assert.equal(res.body.evidence_id, null, 'failing attempt must not produce evidence');
    });
  });

  describe('3. Candidate Evidence Submission & Skill DNA Evaluation', () => {
    let submittedEvidenceId;

    it('should allow student to submit project code evidence for faculty review', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          skill_slug: 'distributed-systems',
          source_type: 'project_submission',
          claim_title: 'Raft Consensus Implementation in Go',
          claim_description: '3-node cluster handling partition failures with leader heartbeat lease.',
          evidence_url: 'https://github.com/skillverse-test/raft-protocol'
        }
      });
      await submitEvidence(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.evidence.id);
      assert.equal(res.body.evidence.review_status, 'pending_review');
      assert.equal(Number(res.body.evidence.confidence_score), 0.35);

      submittedEvidenceId = res.body.evidence.id;
    });

    it('should evaluate candidate Skill DNA with verified assessment and pending project evidence', async () => {
      const { req, res } = createMockReqRes({ user: studentUser });
      await getMySkillDNA(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.dna);
      assert.ok(res.body.dna.engine_version.includes('deterministic'));

      const skills = res.body.dna.skills;
      const rustSkill = skills.find(s => s.slug === 'rust' || s.skill_slug === 'rust');
      assert.ok(rustSkill, 'rust skill must be tracked');
      assert.equal(rustSkill.verification_status, 'verified');
      assert.ok((rustSkill.confidence || rustSkill.confidence_score) >= 0.85);

      const dsSkill = skills.find(s => s.slug === 'distributed-systems' || s.skill_slug === 'distributed-systems');
      assert.ok(dsSkill, 'distributed-systems must be tracked');
      assert.equal(dsSkill.verification_status, 'pending_review');
      assert.equal(dsSkill.confidence || dsSkill.confidence_score, 0.35);
    });

    describe('4. Faculty Evidence Review & Authorization Enforcement', () => {
      it('should allow assigned faculty to view pending mentee evidence', async () => {
        const { req, res } = createMockReqRes({ user: facultyUser });
        await getPendingFacultyEvidence(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.pending_evidence));

        const item = res.body.pending_evidence.find(e => e.id === submittedEvidenceId);
        assert.ok(item, 'assigned faculty must see mentee submitted evidence');
        assert.equal(item.skill_slug, 'distributed-systems');
      });

      it('SECURITY: should reject unassigned faculty with 403 Forbidden', async () => {
        const { req, res } = createMockReqRes({
          user: unassignedFacultyUser,
          params: { id: submittedEvidenceId },
          body: {
            decision: 'verified',
            notes: 'Attempting unassigned verification'
          }
        });
        await reviewEvidence(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.success, false);
      });

      it('should allow assigned faculty to verify evidence and elevate confidence to 0.750', async () => {
        const { req, res } = createMockReqRes({
          user: facultyUser,
          params: { id: submittedEvidenceId },
          body: {
            decision: 'verified',
            notes: 'Code reviewed. Clean Raft log compaction and rigorous state machine verification.'
          }
        });
        await reviewEvidence(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.evidence.review_status, 'verified');
        assert.equal(Number(res.body.evidence.confidence_score), 0.75);

        // Verify re-evaluation reflects verified status
        const dna = await calculateCandidateSkillDNA(candidateId);
        const dsSkill = dna.skills.find(s => s.slug === 'distributed-systems' || s.skill_slug === 'distributed-systems');
        assert.ok(dsSkill, 'distributed-systems skill must be found in evaluated DNA');
        assert.equal(dsSkill.verification_status, 'verified');
        assert.equal(dsSkill.confidence || dsSkill.confidence_score, 0.75);
      });
    });

    describe('5. Skill DNA Deterministic Math & Calculation Edge Cases', () => {
      it('should return unverified with 0 confidence for candidate with no evidence', async () => {
        // Create candidate with no evidence
        const emptyCandRes = await db.query(
          `INSERT INTO candidates (user_id, full_name, email, headline, experience_years)
           VALUES ($1, 'Empty Cand', $2, 'Junior', 0.5) RETURNING id`,
          [studentUser.id, `empty_cand_${timestamp}@skillverse.test`]
        );
        const emptyCandId = emptyCandRes.rows[0].id;

        const dna = await calculateCandidateSkillDNA(emptyCandId);
        assert.equal(dna.overview.total_skills_tracked, 0);
        assert.equal(dna.overview.verified_skills_count, 0);
        assert.equal(dna.overview.average_confidence, 0.0);

        // Clean up
        await db.query(`DELETE FROM candidates WHERE id = $1`, [emptyCandId]);
      });

      it('should cap self-reported skills at 0.350 confidence and mark as self_reported', async () => {
        const { rows: sRows } = await db.query(`SELECT id FROM skills WHERE slug = 'postgresql'`);
        const skillId = sRows[0].id;

        await db.query(
          `INSERT INTO skill_evidence (candidate_id, skill_id, source_type, review_status, confidence_score, title)
           VALUES ($1, $2, 'self_reported', 'unreviewed', 0.999, 'Claiming 10 years PostgreSQL experience')`,
          [candidateId, skillId]
        );

        const dna = await calculateCandidateSkillDNA(candidateId);
        const pgSkill = dna.skills.find(s => s.slug === 'postgresql' || s.skill_slug === 'postgresql');
        assert.ok(pgSkill);
        assert.ok(pgSkill.verification_status === 'self_reported' || pgSkill.verification_status === 'unverified');
        assert.ok((pgSkill.confidence || pgSkill.confidence_score) <= 0.350, 'self-reported confidence must be capped at 0.350');
      });

      it('should assign zero confidence and rejected status to rejected evidence', async () => {
        const { rows: sRows } = await db.query(`SELECT id FROM skills WHERE slug = 'docker'`);
        const skillId = sRows[0].id;

        await db.query(
          `INSERT INTO skill_evidence (candidate_id, skill_id, source_type, review_status, confidence_score, title, review_feedback)
           VALUES ($1, $2, 'project_submission', 'rejected', 0.000, 'Trivial Dockerfile', 'Plagiarized submission')`,
          [candidateId, skillId]
        );

        const dna = await calculateCandidateSkillDNA(candidateId);
        const dockerSkill = dna.skills.find(s => s.slug === 'docker' || s.skill_slug === 'docker');
        assert.ok(dockerSkill);
        assert.equal(dockerSkill.verification_status, 'rejected');
        assert.equal(dockerSkill.confidence || dockerSkill.confidence_score, 0.0);
      });
    });
  });
});
