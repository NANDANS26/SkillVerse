// Backend/tests/postgres_persistence.integration.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { db, pool } from '../src/config/db.js';
import { signup, login } from '../src/controllers/auth.controller.js';
import {
  createCandidate,
  getMyCandidateProfile,
  getCandidate
} from '../src/controllers/candidates.controller.js';
import {
  createJob,
  getJob,
  listJobs,
  getMatches
} from '../src/controllers/jobs.controller.js';
import { callMLForMatches } from '../src/services/ml.service.js';

function createMockReqRes(options = {}) {
  const req = {
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user || null,
    params: options.params || {}
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
      this.clearedCookie = { name, options: opts };
      return this;
    }
  };

  return { req, res };
}

describe('Real PostgreSQL Persistence & Security Integration Suite', () => {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@skillverse.test`;
  const studentBEmail = `student_b_${timestamp}@skillverse.test`;
  const recruiterEmail = `recruiter_${timestamp}@skillverse.test`;
  const recruiterBEmail = `recruiter_b_${timestamp}@skillverse.test`;

  let studentUser;
  let studentBUser;
  let recruiterUser;
  let recruiterBUser;
  let createdCandidateId;
  let createdJobId;

  before(async () => {
    process.env.ML_SERVICE_URL = 'http://127.0.0.1:8000';
    // Verify connection to real PostgreSQL
    const { rows } = await db.query('SELECT version(), current_database()');
    assert.ok(rows[0].version.includes('PostgreSQL'));
    console.log(`[Integration Test] Connected to live ${rows[0].version.split(',')[0]} (database: ${rows[0].current_database})`);
  });

  after(async () => {
    await pool.end();
  });

  describe('1. Authentication, RBAC & Privilege Escalation Defense', () => {
    it('blocks self-registration of privileged role super_admin with 403 Forbidden', async () => {
      const { req, res } = createMockReqRes({
        body: {
          name: 'Hacker SuperAdmin',
          email: `hacker_${timestamp}@skillverse.test`,
          password: 'Password123!',
          role: 'super_admin'
        }
      });

      await signup(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /Self-registration is not allowed for role/);
    });

    it('persists a new student user to PostgreSQL via signup', async () => {
      const { req, res } = createMockReqRes({
        body: {
          name: 'Real Student Alice',
          email: studentEmail,
          password: 'Password123!',
          role: 'student'
        }
      });

      await signup(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.user?.id);
      assert.equal(res.body.user.email, studentEmail);
      assert.equal(res.body.user.role, 'student');
      assert.ok(res.body.token);

      studentUser = res.body.user;

      // Verify row actually exists in PostgreSQL
      const { rows } = await db.query('SELECT id, name, email, role, password_hash FROM users WHERE id = $1', [studentUser.id]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].email, studentEmail);
      assert.ok(rows[0].password_hash.startsWith('$2')); // bcrypt hash
    });

    it('persists a second student user for privacy checks', async () => {
      const { req, res } = createMockReqRes({
        body: {
          name: 'Real Student Bob',
          email: studentBEmail,
          password: 'Password123!',
          role: 'student'
        }
      });

      await signup(req, res);
      assert.equal(res.statusCode, 201);
      studentBUser = res.body.user;
    });

    it('persists two recruiter users for job ownership checks', async () => {
      const { req: reqA, res: resA } = createMockReqRes({
        body: {
          name: 'Recruiter Alpha',
          email: recruiterEmail,
          password: 'Password123!',
          role: 'recruiter'
        }
      });
      await signup(reqA, resA);
      assert.equal(resA.statusCode, 201);
      recruiterUser = resA.body.user;

      const { req: reqB, res: resB } = createMockReqRes({
        body: {
          name: 'Recruiter Beta',
          email: recruiterBEmail,
          password: 'Password123!',
          role: 'recruiter'
        }
      });
      await signup(reqB, resB);
      assert.equal(resB.statusCode, 201);
      recruiterBUser = resB.body.user;
    });

    it('authenticates user with correct credentials and rejects invalid password', async () => {
      // 1. Invalid password
      const { req: badReq, res: badRes } = createMockReqRes({
        body: { email: studentEmail, password: 'WrongPassword!' }
      });
      await login(badReq, badRes);
      assert.equal(badRes.statusCode, 401);

      // 2. Correct password
      const { req: goodReq, res: goodRes } = createMockReqRes({
        body: { email: studentEmail, password: 'Password123!' }
      });
      await login(goodReq, goodRes);
      assert.equal(goodRes.statusCode, 200);
      assert.equal(goodRes.body.user.email, studentEmail);
    });

    it('enforces email uniqueness at database level', async () => {
      const { req, res } = createMockReqRes({
        body: {
          name: 'Duplicate Alice',
          email: studentEmail,
          password: 'Password123!',
          role: 'student'
        }
      });
      await signup(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Email already registered/);
    });
  });

  describe('2. Student Candidate Profile Persistence & Ownership', () => {
    it('creates and persists a candidate profile to PostgreSQL', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          full_name: 'Real Student Alice',
          headline: 'Full Stack Engineer & Cloud Developer',
          email: studentEmail,
          phone: '+1-555-0144',
          experience_years: 3.5,
          resume_text: 'Experienced in React, TypeScript, Node.js, PostgreSQL, and Python ML pipelines.',
          skill_json: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python']
        }
      });

      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.candidate_id);
      createdCandidateId = res.body.candidate_id;

      // Verify row directly in PostgreSQL
      const { rows } = await db.query('SELECT * FROM candidates WHERE id = $1', [createdCandidateId]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].user_id, studentUser.id);
      assert.equal(rows[0].email, studentEmail);
      assert.equal(Number(rows[0].experience_years), 3.5);
    });

    it('retrieves the saved candidate profile via getMyCandidateProfile', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser
      });

      await getMyCandidateProfile(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.candidate);
      assert.equal(res.body.candidate.id, createdCandidateId);
      assert.equal(res.body.candidate.headline, 'Full Stack Engineer & Cloud Developer');
      assert.ok(Array.isArray(res.body.candidate.skill_json));
      assert.ok(res.body.candidate.skill_json.includes('PostgreSQL'));
    });

    it('updates candidate profile and preserves user ownership', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          full_name: 'Real Student Alice (Updated)',
          headline: 'Senior Full Stack & AI Systems Architect',
          email: studentEmail,
          phone: '+1-555-0144',
          experience_years: 4.0,
          resume_text: 'Senior engineer specializing in React, Node.js, PostgreSQL, and FastAPI.',
          skill_json: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'FastAPI', 'Docker']
        }
      });

      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.candidate_id, createdCandidateId);

      // Verify PostgreSQL update
      const { rows } = await db.query('SELECT headline, experience_years FROM candidates WHERE id = $1', [createdCandidateId]);
      assert.equal(rows[0].headline, 'Senior Full Stack & AI Systems Architect');
      assert.equal(Number(rows[0].experience_years), 4.0);
    });

    it('prevents another student from accessing or reading private profile', async () => {
      const { req, res } = createMockReqRes({
        user: studentBUser,
        params: { id: createdCandidateId }
      });

      await getCandidate(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /Access denied/);
    });
  });

  describe('3. Recruiter Job Persistence & Matching Access Control', () => {
    it('creates and persists a recruiter job to PostgreSQL', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        body: {
          title: 'Senior PostgreSQL & React Developer',
          location: 'Remote, US',
          description: 'Looking for a Senior Developer with strong PostgreSQL, Node.js, and React skills.',
          experience_min: 2,
          experience_max: 6,
          required_skills: ['PostgreSQL', 'React', 'Node.js', 'TypeScript']
        }
      });

      await createJob(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.job_id);
      createdJobId = res.body.job_id;

      // Verify row in PostgreSQL
      const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [createdJobId]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].recruiter_id, recruiterUser.id);
      assert.equal(rows[0].title, 'Senior PostgreSQL & React Developer');
      assert.equal(rows[0].status, 'open');
    });

    it('retrieves the persisted job by ID', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        params: { id: createdJobId }
      });

      await getJob(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.job.id, createdJobId);
      assert.equal(res.body.job.title, 'Senior PostgreSQL & React Developer');
    });

    it('lists jobs scoped to the recruiter', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser
      });

      await listJobs(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.jobs));
      const found = res.body.jobs.find(j => j.id === createdJobId);
      assert.ok(found);
      assert.equal(found.recruiter_id, recruiterUser.id);
    });

    it('denies a different recruiter access to matches for this job', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterBUser, // Different recruiter
        params: { id: createdJobId }
      });

      await getMatches(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /Access denied/);
    });

    it('executes AI matching for the job owner when microservice is online', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser, // Owner
        params: { id: createdJobId }
      });

      await getMatches(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.matches));
      assert.ok(res.body.matches.length > 0);
      assert.ok(typeof res.body.matches[0].match_score === 'number');
    });
  });

  describe('4. Transactional Integrity & Rollback Verification', () => {
    it('successfully rolls back transaction on error without corrupting state', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const testEmail = `rollback_${timestamp}@skillverse.test`;
        await client.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          ['Rollback Test', testEmail, 'dummyhash', 'student']
        );

        // Verify inside transaction row exists
        const { rows: insideRows } = await client.query('SELECT id FROM users WHERE email = $1', [testEmail]);
        assert.equal(insideRows.length, 1);

        // Intentionally trigger rollback
        await client.query('ROLLBACK');

        // Verify outside transaction row DOES NOT exist
        const { rows: outsideRows } = await db.query('SELECT id FROM users WHERE email = $1', [testEmail]);
        assert.equal(outsideRows.length, 0);
      } finally {
        client.release();
      }
    });
  });
});
