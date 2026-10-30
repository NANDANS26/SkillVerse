// Backend/tests/phase8_1_audit_semantics.test.js
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
  reviewEvidence 
} from '../src/controllers/skills.controller.js';
import { 
  listAssessments, 
  getAssessment, 
  submitAttempt, 
  getMyAttempts 
} from '../src/controllers/assessments.controller.js';
import { 
  calculateCandidateSkillDNA, 
  SKILL_DNA_ENGINE_VERSION,
  EVIDENCE_CONFIDENCE_WEIGHTS
} from '../src/services/skill_dna.service.js';

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

describe('SkillVerse Phase 8.1: Scoring Semantics, Evidence Integrity & Security Audit', () => {
  const timestamp = Date.now();
  let studentUser;
  let candidateId;
  let facultyUser;
  let unassignedFacultyUser;
  let recruiterUser;
  let institutionId;

  before(async () => {
    // 1. Create Student
    const { req: sReq, res: sRes } = createMockReqRes({
      body: {
        email: `phase8_1_student_${timestamp}@skillverse.test`,
        password: 'Password123!',
        name: 'Phase8_1 Audit Student',
        role: 'student'
      }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    const { req: cpReq, res: cpRes } = createMockReqRes({
      user: studentUser,
      body: {
        headline: 'Systems & Verification Engineer',
        experience_years: 3.0,
        skill_json: ['Rust', 'Distributed Systems'],
        resume_text: 'Engineering fault-tolerant systems in Rust.'
      }
    });
    await createCandidate(cpReq, cpRes);
    candidateId = cpRes.body.candidate_id;

    // 2. Create Assigned Faculty
    const { rows: fRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      ['Prof. Dijkstra', `phase8_1_faculty_${timestamp}@audit.edu`]
    );
    facultyUser = fRows[0];

    // 3. Create Unassigned Faculty
    const { rows: ufRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      ['Prof. Lamport', `phase8_1_unassigned_${timestamp}@audit.edu`]
    );
    unassignedFacultyUser = ufRows[0];

    // 4. Create Recruiter
    const { rows: rRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'recruiter') RETURNING id, name, email, role`,
      ['Recruiter Jane', `phase8_1_recruiter_${timestamp}@hire.com`]
    );
    recruiterUser = rRows[0];

    // 5. Create Institution & Mentorship Assignment
    const instRes = await db.query(
      `INSERT INTO institutions (name, code, domain) 
       VALUES ($1, $2, $3) RETURNING id`,
      [`Audit University ${timestamp}`, `audit-uni-${timestamp}`, `audit-${timestamp}.edu`]
    );
    institutionId = instRes.rows[0].id;

    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'faculty'), ($1, $3, 'student')`,
      [institutionId, facultyUser.id, studentUser.id]
    );

    await db.query(
      `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes)
       VALUES ($1, $2, $3, 'active', 'Academic advisor for formal verification.')`,
      [institutionId, facultyUser.id, studentUser.id]
    );
  });

  describe('A. Scoring Semantics & Disentanglement (Proficiency vs. Confidence)', () => {
    it('SEMANTICS: should mark self-reported skill as Unassessed proficiency tier and bounded confidence <= 0.350', async () => {
      const dna = await calculateCandidateSkillDNA(candidateId);
      const dsSkill = dna.skills.find(s => s.slug === 'distributed-systems');
      assert.ok(dsSkill);
      // Proficiency must be Unassessed because no assessment or rubric score exists
      assert.equal(dsSkill.proficiency_tier, 'Unassessed');
      assert.equal(dsSkill.proficiency_score, null);
      // Evidence confidence must not exceed 0.350
      assert.ok(dsSkill.confidence <= 0.350);
      assert.equal(dsSkill.verification_status, 'unverified');
    });

    it('SEMANTICS: faculty verification raises confidence but keeps proficiency as Unassessed without a test score', async () => {
      // Student submits project evidence
      const { req: subReq, res: subRes } = createMockReqRes({
        user: studentUser,
        body: {
          skill_slug: 'distributed-systems',
          source_type: 'project_submission',
          title: 'Distributed Paxos Node',
          source_reference: 'https://github.com/skillverse-audit/paxos-node'
        }
      });
      await submitEvidence(subReq, subRes);
      assert.equal(subRes.statusCode, 201);
      const evidenceId = subRes.body.evidence.id;

      // Faculty verifies project
      const { req: revReq, res: revRes } = createMockReqRes({
        user: facultyUser,
        params: { id: evidenceId },
        body: {
          decision: 'verified',
          feedback: 'Verified Paxos consensus state transitions and network partitioning resilience.'
        }
      });
      await reviewEvidence(revReq, revRes);
      assert.equal(revRes.statusCode, 200);

      // Re-evaluate DNA
      const dna = await calculateCandidateSkillDNA(candidateId);
      const dsSkill = dna.skills.find(s => s.slug === 'distributed-systems');
      assert.ok(dsSkill);
      assert.equal(dsSkill.verification_status, 'verified');
      assert.equal(dsSkill.confidence, 0.750);
      // CRITICAL: Verified project establishes evidence certainty (0.750), NOT an uncalibrated numeric proficiency grade!
      assert.equal(dsSkill.proficiency_tier, 'Unassessed');
      assert.equal(dsSkill.proficiency_score, null);
    });

    it('SEMANTICS: passing standardized benchmark assigns empirical proficiency score and evaluated tier', async () => {
      // Candidate passes Rust assessment with 100%
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'rust-systems-foundations' },
        body: {
          answers: { q1: 'b', q2: 'a', q3: 'b', q4: 'b', q5: 'b' }
        }
      });
      await submitAttempt(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.passed, true);
      assert.equal(res.body.score, 100);

      const dna = await calculateCandidateSkillDNA(candidateId);
      const rustSkill = dna.skills.find(s => s.slug === 'rust');
      assert.ok(rustSkill);
      assert.equal(rustSkill.verification_status, 'verified');
      assert.equal(rustSkill.confidence, 0.850);
      assert.equal(rustSkill.proficiency_tier, 'Advanced');
      assert.equal(rustSkill.proficiency_score, 1.0);
    });
  });

  describe('B. Evidence Aggregation Formula & Source Deduplication', () => {
    it('DEDUPLICATION: duplicate evidence items with identical source_reference do not compound confidence', async () => {
      const { rows: sRows } = await db.query(`SELECT id FROM skills WHERE slug = 'distributed-systems'`);
      const skillId = sRows[0].id;

      // Insert duplicate evidence pointing to the same repo URL
      await db.query(
        `INSERT INTO skill_evidence (candidate_id, skill_id, source_type, title, source_reference, review_status, confidence_score)
         VALUES ($1, $2, 'project_submission', 'Duplicate Paxos Link 1', 'https://github.com/skillverse-audit/paxos-node', 'pending_review', 0.350),
                ($1, $2, 'project_submission', 'Duplicate Paxos Link 2', 'https://github.com/skillverse-audit/paxos-node', 'pending_review', 0.350)`,
        [candidateId, skillId]
      );

      const dna = await calculateCandidateSkillDNA(candidateId);
      const dsSkill = dna.skills.find(s => s.slug === 'distributed-systems');
      assert.ok(dsSkill);

      // The verified faculty review (0.750) and duplicate pending items share the same repo source reference
      // Thus sourceMap collapses them to the highest weight (0.750) rather than compounding 1 - (1-0.75)(1-0.35)(1-0.35)
      assert.equal(dsSkill.confidence, 0.750);
      assert.equal(dsSkill.distinct_sources_count, 1);
    });

    it('IDEMPOTENCY: re-evaluating unchanged candidate produces identical deterministic output', async () => {
      const dna1 = await calculateCandidateSkillDNA(candidateId);
      const dna2 = await calculateCandidateSkillDNA(candidateId);
      assert.deepEqual(dna1.overview, dna2.overview);
      assert.equal(dna1.skills.length, dna2.skills.length);
      assert.equal(dna1.skills[0].confidence, dna2.skills[0].confidence);
    });
  });

  describe('C. Assessment Security & Anti-Cheating Controls', () => {
    it('SECURITY: answer keys strictly withheld on both public and authenticated fetch', async () => {
      const { req: pReq, res: pRes } = createMockReqRes({ params: { slug: 'rust-systems-foundations' } });
      await getAssessment(pReq, pRes);
      assert.equal(pRes.statusCode, 200);
      assert.equal(pRes.body.assessment.answer_keys_json, undefined);
      assert.equal(pRes.body.assessment.answer_keys, undefined);

      const { req: aReq, res: aRes } = createMockReqRes({ 
        user: studentUser,
        params: { slug: 'rust-systems-foundations' } 
      });
      await getAssessment(aReq, aRes);
      assert.equal(aRes.statusCode, 200);
      assert.equal(aRes.body.assessment.answer_keys_json, undefined);
    });

    it('SECURITY: client-submitted score/confidence parameters are ignored; grading is 100% server-side', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'distributed-systems-consensus' },
        body: {
          score: 1.0, // Spoofed score attempt
          confidence: 0.999, // Spoofed confidence
          passed: true,
          answers: { q1: 'wrong', q2: 'wrong', q3: 'wrong', q4: 'wrong', q5: 'wrong' }
        }
      });
      await submitAttempt(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.passed, false, 'spoofed score must be rejected by server grading');
      assert.equal(res.body.score, 0, 'server-calculated score must be 0%');
      assert.equal(res.body.evidence_id, null, 'failed attempt must not create verified evidence');
    });

    it('SECURITY: attempt retries do not duplicate verified evidence rows in PostgreSQL', async () => {
      // Submit Rust assessment a second time with passing score
      const { req, res } = createMockReqRes({
        user: studentUser,
        params: { slug: 'rust-systems-foundations' },
        body: {
          answers: { q1: 'b', q2: 'a', q3: 'b', q4: 'b', q5: 'b' }
        }
      });
      await submitAttempt(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.passed, true);

      // Verify that skill_evidence has exactly ONE assessment_result row for rust
      const { rows } = await db.query(
        `SELECT COUNT(*) as count 
         FROM skill_evidence 
         WHERE candidate_id = $1 AND source_type = 'assessment_result'`,
        [candidateId]
      );
      assert.equal(Number(rows[0].count), 1, 'assessment evidence must be updated in place, never duplicated');
    });
  });

  describe('D. Role Authorization & Recruiter Data Protection', () => {
    it('AUTHORIZATION: unassigned faculty cannot verify student evidence (HTTP 403)', async () => {
      // Find an evidence ID
      const { rows } = await db.query(
        `SELECT id FROM skill_evidence WHERE candidate_id = $1 LIMIT 1`,
        [candidateId]
      );
      const evidenceId = rows[0].id;

      const { req, res } = createMockReqRes({
        user: unassignedFacultyUser,
        params: { id: evidenceId },
        body: { decision: 'verified' }
      });
      await reviewEvidence(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
    });

    it('DATA PRIVACY: recruiter view sanitizes private faculty notes and raw responses', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        params: { id: candidateId }
      });
      await getCandidateSkillDNAById(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.skill_dna);

      // Inspect evidence items returned to recruiter
      for (const skill of res.body.skill_dna.skills) {
        for (const ev of skill.evidence_items) {
          assert.equal(ev.review_feedback, undefined, 'private faculty review feedback must be stripped for recruiters');
          assert.equal(ev.reviewer_id, undefined, 'internal reviewer id must be stripped for recruiters');
        }
      }
    });
  });
});
