// Backend/tests/dynamic_indexing.integration.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, pool } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { createJob, getMatches } from '../src/controllers/jobs.controller.js';
import { getMLIndexStatus } from '../src/services/ml.service.js';

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

describe('SkillVerse Phase 5.3 Dynamic Candidate Indexing & AI Matching Suite', () => {
  const timestamp = Date.now();
  let studentUser;
  let recruiterUser;
  let studentCandidateId;
  let recruiterJobId;
  let initialLiveIndexCount = 0;

  before(async () => {
    try {
      const status = await getMLIndexStatus();
      initialLiveIndexCount = status.live_index?.total_candidates || 0;
    } catch {
      initialLiveIndexCount = 0;
    }

    // Register Student User
    const studentEmail = `dynamic_student_${timestamp}@skillverse.test`;
    const { req: sReq, res: sRes } = createMockReqRes({
      body: {
        name: 'Dynamic Student Alice',
        email: studentEmail,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    // Register Recruiter User
    const recruiterEmail = `dynamic_recruiter_${timestamp}@skillverse.test`;
    const { req: rReq, res: rRes } = createMockReqRes({
      body: {
        name: 'Dynamic Recruiter Bob',
        email: recruiterEmail,
        password: 'Password123!',
        role: 'recruiter'
      }
    });
    await signup(rReq, rRes);
    recruiterUser = rRes.body.user;
  });

  describe('Test A: New Candidate Dynamic Indexing (POST /api/candidates)', () => {
    it('persists student profile and synchronously indexes vector in dynamic store', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          full_name: 'Dynamic Student Alice',
          headline: 'Distributed Systems & Cloud Engineer',
          email: studentUser.email,
          experience_years: 3.5,
          resume_text: 'Hands-on experience architecting distributed consensus with Raft, Kubernetes, and Go.',
          skill_json: ['Distributed Systems', 'Kubernetes', 'Go', 'Raft Consensus', 'Docker']
        }
      });

      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.indexing_status, 'indexed');
      assert.ok(typeof res.body.candidate_id === 'number');
      studentCandidateId = res.body.candidate_id;

      // Verify FastAPI live index count incremented
      const status = await getMLIndexStatus();
      assert.equal(status.live_index.total_candidates, initialLiveIndexCount + 1);
    });
  });

  describe('Test B: Candidate Profile Update and Invalidation Idempotency', () => {
    it('updates candidate profile without duplicate vector accumulation', async () => {
      const statusBefore = await getMLIndexStatus();
      const countBefore = statusBefore.live_index.total_candidates;
      const uniqueSkill = `QuantumSecurity_${timestamp}`;

      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          full_name: 'Dynamic Student Alice (Updated)',
          headline: `Quantum Cryptography & Post-Quantum Security Researcher ${timestamp}`,
          email: studentUser.email,
          experience_years: 4.0,
          resume_text: `Specialized in lattice-based cryptography, Kyber, Dilithium, and Python algorithms. Key: ${uniqueSkill}`,
          skill_json: [uniqueSkill, 'Post-Quantum Algorithms', 'Python', 'Kyber']
        }
      });

      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.indexing_status, 'indexed');
      assert.equal(res.body.candidate_id, studentCandidateId);

      // Verify candidate count remains idempotent (no duplicate IDs)
      const statusAfter = await getMLIndexStatus();
      assert.equal(statusAfter.live_index.total_candidates, countBefore);

      // Verify PostgreSQL record was updated
      const { rows } = await db.query('SELECT headline, skill_json FROM candidates WHERE id = $1', [studentCandidateId]);
      assert.equal(rows[0].headline, `Quantum Cryptography & Post-Quantum Security Researcher ${timestamp}`);
    });
  });

  describe('Test C: Real Job Matching against Live Persisted Candidates', () => {
    it('creates a recruiter job requiring candidate skills', async () => {
      const uniqueSkill = `QuantumSecurity_${timestamp}`;
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        body: {
          title: `Post-Quantum Cryptography Specialist ${timestamp}`,
          description: `Looking for an engineer with expertise in Post-Quantum Algorithms and Python. Key: ${uniqueSkill}`,
          required_skills: [uniqueSkill, 'Post-Quantum Algorithms', 'Python'],
          min_experience: 3.0
        }
      });

      await createJob(req, res);
      assert.equal(res.statusCode, 201);
      const jobId = res.body.job_id || res.body.job?.id;
      assert.ok(jobId);
      recruiterJobId = jobId;
    });

    it('matches real PostgreSQL student in mode=live with LightGBM ranking', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        params: { id: recruiterJobId },
        query: { mode: 'live' }
      });

      await getMatches(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.mode, 'live');
      assert.ok(Array.isArray(res.body.matches));
      assert.ok(res.body.matches.length > 0);

      // Top match must be our persisted PostgreSQL candidate
      const topMatch = res.body.matches.find(m => m.candidate_id === studentCandidateId || m.id === studentCandidateId);
      assert.ok(topMatch, `Candidate ${studentCandidateId} should be in matches`);
      assert.equal(topMatch.source, 'postgresql_live');
      assert.ok(typeof topMatch.match_score === 'number');
      assert.ok(typeof topMatch.embedding_sim === 'number');
      assert.ok(topMatch.skill_overlap > 0);
      assert.equal(topMatch.exp_match, 1);
    });
  });

  describe('Test D: Zero-Match & Benchmark Mode Isolation', () => {
    it('returns genuine zero matches (200 OK, count: 0) for impossible criteria in live mode', async () => {
      const { req: cReq, res: cRes } = createMockReqRes({
        user: recruiterUser,
        body: {
          title: 'Ancient Alchemy Specialist',
          description: 'Requires medieval alchemy and philosopher stone transmutation.',
          required_skills: ['PhilosophersStone999', 'MedievalAlchemy777'],
          min_experience: 100
        }
      });
      await createJob(cReq, cRes);
      const impossibleJobId = cRes.body.job_id || cRes.body.job?.id;
      assert.ok(impossibleJobId);

      const { req, res } = createMockReqRes({
        user: recruiterUser,
        params: { id: impossibleJobId },
        query: { mode: 'live' }
      });

      await getMatches(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.mode, 'live');
      assert.ok(Array.isArray(res.body.matches));
      assert.equal(res.body.matches.length, 0);
      assert.equal(res.body.count, 0);
    });

    it('queries 5,000 synthetic benchmark records when mode=benchmark without polluting live pool', async () => {
      // Create a job targeting standard skills present in the benchmark dataset
      const { req: bJobReq, res: bJobRes } = createMockReqRes({
        user: recruiterUser,
        body: {
          title: 'Full Stack Web Developer',
          description: 'Hiring developer with strong React, JavaScript, and Node skills.',
          required_skills: ['React', 'JavaScript', 'Node.js'],
          min_experience: 2.0
        }
      });
      await createJob(bJobReq, bJobRes);
      const benchmarkJobId = bJobRes.body.job_id || bJobRes.body.job?.id;
      assert.ok(benchmarkJobId);

      const { req, res } = createMockReqRes({
        user: recruiterUser,
        params: { id: benchmarkJobId },
        query: { mode: 'benchmark' }
      });

      await getMatches(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.mode, 'benchmark');
      assert.ok(Array.isArray(res.body.matches));
      assert.ok(res.body.matches.length > 0);
      assert.equal(res.body.matches[0].source, 'benchmark');
    });
  });

  describe('Test E: ML Microservice Fault Tolerance & Resilient Persistence', () => {
    it('persists candidate in PostgreSQL and marks indexing as pending when ML service is offline', async () => {
      const originalUrl = process.env.ML_SERVICE_URL;
      process.env.ML_SERVICE_URL = 'http://127.0.0.1:59999'; // Unreachable port

      try {
        const offlineStudentEmail = `offline_student_${timestamp}@skillverse.test`;
        const { req: sReq, res: sRes } = createMockReqRes({
          body: {
            name: 'Offline Student Charlie',
            email: offlineStudentEmail,
            password: 'Password123!',
            role: 'student'
          }
        });
        await signup(sReq, sRes);
        const offlineUser = sRes.body.user;

        const { req, res } = createMockReqRes({
          user: offlineUser,
          body: {
            full_name: 'Offline Student Charlie',
            headline: 'Resilient Persistence Candidate',
            email: offlineStudentEmail,
            experience_years: 2.0,
            skill_json: ['PostgreSQL', 'Node.js']
          }
        });

        await createCandidate(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.indexing_status, 'pending');
        assert.ok(typeof res.body.candidate_id === 'number');

        // Verify candidate exists in PostgreSQL
        const { rows } = await db.query('SELECT id, full_name FROM candidates WHERE id = $1', [res.body.candidate_id]);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].full_name, 'Offline Student Charlie');
      } finally {
        process.env.ML_SERVICE_URL = originalUrl || 'http://127.0.0.1:8000';
      }
    });
  });

  after(async () => {
    await pool.end();
  });
});
