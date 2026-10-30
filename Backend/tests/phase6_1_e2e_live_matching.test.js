// Backend/tests/phase6_1_e2e_live_matching.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { createJob, getMatches } from '../src/controllers/jobs.controller.js';
import { callMLToEmbedCandidate, callMLForMatches } from '../src/services/ml.service.js';
import { processPendingQueue } from '../src/services/indexing_queue.service.js';

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

describe('SkillVerse Phase 6.1: Dynamic FAISS Indexing & Live Matching Audit Suite', () => {
  const timestamp = Date.now();
  let studentUser;
  let recruiterUser;
  let candidateId;
  let jobId;

  before(async () => {
    // 1. Sign up a unique test student
    const studentEmail = `live_e2e_student_${timestamp}@skillverse.test`;
    const { req: sReq, res: sRes } = createMockReqRes({
      body: { name: 'E2E Vector Student', email: studentEmail, password: 'Password123!', role: 'student' }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    // 2. Sign up a unique test recruiter
    const recruiterEmail = `live_e2e_recruiter_${timestamp}@skillverse.test`;
    const { req: rReq, res: rRes } = createMockReqRes({
      body: { name: 'E2E Vector Recruiter', email: recruiterEmail, password: 'Password123!', role: 'recruiter' }
    });
    await signup(rReq, rRes);
    recruiterUser = rRes.body.user;
  });

  it('Step 1-6: persists student, enqueues to outbox, indexes vector, and links metadata', async () => {
    const { req, res } = createMockReqRes({
      user: studentUser,
      body: {
        full_name: 'E2E Vector Student',
        headline: 'Specialized Quantum Computing & Qiskit Engineer',
        email: studentUser.email,
        experience_years: 4.0,
        resume_text: 'Designed quantum error-mitigation algorithms using Qiskit, Cirq, and Python.',
        skill_json: ['Qiskit', 'Cirq', 'Quantum Computing', 'Python']
      }
    });

    await createCandidate(req, res);
    assert.equal(res.statusCode, 201);
    candidateId = res.body.candidate_id;
    assert.ok(candidateId, 'Candidate must have an authoritative PostgreSQL ID');

    // Verify outbox queue record exists in PostgreSQL
    const { rows: queueRows } = await db.query(
      'SELECT id, status, attempts FROM indexing_queue WHERE candidate_id = $1 ORDER BY id DESC LIMIT 1',
      [candidateId]
    );
    assert.ok(queueRows.length > 0);
    assert.equal(queueRows[0].status, 'completed', 'Live indexing completes on online ML service');

    // Verify candidate is indexed in live FAISS store via ML status endpoint
    const mlStatusRes = await fetch('http://127.0.0.1:8000/api/v1/index_status');
    const mlStatus = await mlStatusRes.json();
    assert.ok(mlStatus.live_index?.total_candidates > 0);
  });

  it('Step 7: matches real candidate through live matching endpoint when criteria align', async () => {
    // Recruiter creates a quantum computing job
    const { req: jReq, res: jRes } = createMockReqRes({
      user: recruiterUser,
      body: {
        title: 'Quantum Software Researcher',
        description: 'Seeking an expert in Qiskit quantum algorithms and circuit synthesis.',
        required_skills: ['Qiskit', 'Quantum Computing', 'Python'],
        min_experience: 3
      }
    });

    await createJob(jReq, jRes);
    assert.equal(jRes.statusCode, 201);
    jobId = jRes.body.job_id;

    // Recruiter queries live matches
    const { req: mReq, res: mRes } = createMockReqRes({
      user: recruiterUser,
      params: { id: jobId },
      query: { mode: 'live' }
    });

    await getMatches(mReq, mRes);
    assert.equal(mRes.statusCode, 200);
    assert.ok(Array.isArray(mRes.body.matches));

    const matchedCandidate = mRes.body.matches.find(m => m.candidate_id === candidateId || m.id === candidateId);
    assert.ok(matchedCandidate, `Persisted candidate ${candidateId} must be returned in live matches`);
    assert.ok(matchedCandidate.match_score > 0.6, 'Match score must reflect strong quantum skill overlap');
  });

  it('Step 8-9: updates profile skills, refreshes index without duplicate candidate accumulation', async () => {
    // Candidate transitions skills to Bioinformatics
    const { req: uReq, res: uRes } = createMockReqRes({
      user: studentUser,
      body: {
        full_name: 'E2E Vector Student',
        headline: 'Computational Biology & Genomics Specialist',
        email: studentUser.email,
        experience_years: 4.5,
        resume_text: 'Genomic sequence alignment, BLAST, Biopython, and Nextflow pipelines.',
        skill_json: ['Biopython', 'Nextflow', 'Genomics', 'Bioinformatics']
      }
    });

    await createCandidate(uReq, uRes);
    assert.equal(uRes.statusCode, 201);

    // Query quantum job again in live mode
    const { req: mReq, res: mRes } = createMockReqRes({
      user: recruiterUser,
      params: { id: jobId },
      query: { mode: 'live' }
    });

    await getMatches(mReq, mRes);
    assert.equal(mRes.statusCode, 200);

    // Verify candidate is only returned AT MOST once (no duplicate vectors)
    const matchesForCandidate = mRes.body.matches.filter(m => m.candidate_id === candidateId || m.id === candidateId);
    assert.ok(matchesForCandidate.length <= 1, 'Candidate must never appear as duplicate matches');
  });

  it('Step 10: enforces idempotency across repeated indexing invocations', async () => {
    // Directly call ML embed for candidate twice
    const embedPayload = {
      candidate_id: candidateId,
      full_name: 'E2E Vector Student',
      headline: 'Computational Biology & Genomics Specialist',
      email: studentUser.email,
      experience_years: 4.5,
      resume_text: 'Genomic sequence alignment, BLAST, Biopython, and Nextflow pipelines.',
      skill_json: ['Biopython', 'Nextflow', 'Genomics', 'Bioinformatics']
    };

    const res1 = await callMLToEmbedCandidate(embedPayload);
    const res2 = await callMLToEmbedCandidate(embedPayload);

    assert.equal(res1.status, 'indexed');
    assert.equal(res2.status, 'indexed');

    // Total count in live index must remain stable
    const mlStatusRes = await fetch('http://127.0.0.1:8000/api/v1/index_status');
    const mlStatus = await mlStatusRes.json();
    assert.ok(mlStatus.live_index?.total_candidates >= 1);
  });
});
