// Backend/tests/phase6_1_outbox_atomicity.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, pool } from '../src/config/db.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { signup } from '../src/controllers/auth.controller.js';
import { enqueueCandidateIndexing, processPendingQueue, getQueueStatus } from '../src/services/indexing_queue.service.js';

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

describe('SkillVerse Phase 6.1: Transactional Outbox Atomicity & Failure Suite', () => {
  const timestamp = Date.now();
  let testUser;
  let failUser;

  before(async () => {
    const email = `outbox_audit_${timestamp}@skillverse.test`;
    const { req: sReq, res: sRes } = createMockReqRes({
      body: { name: 'Outbox Auditor', email, password: 'Password123!', role: 'student' }
    });
    await signup(sReq, sRes);
    testUser = sRes.body.user;

    const emailFail = `outbox_fail_${timestamp}@skillverse.test`;
    const { req: fReq, res: fRes } = createMockReqRes({
      body: { name: 'Outbox Fail User', email: emailFail, password: 'Password123!', role: 'student' }
    });
    await signup(fReq, fRes);
    failUser = fRes.body.user;
  });

  it('rolls back candidate insertion when indexing queue insertion fails (no unindexed candidates)', async () => {
    const unindexedEmail = `unindexed_candidate_${timestamp}@skillverse.test`;

    // Intercept client query safely via wrapper to simulate failure specifically during queue insertion
    const originalConnect = db.connect;
    db.connect = async () => {
      const realClient = await pool.connect();
      return {
        query: async (text, params) => {
          if (typeof text === 'string' && text.includes('INSERT INTO indexing_queue')) {
            throw new Error('SIMULATED_QUEUE_DISK_FAILURE');
          }
          return realClient.query(text, params);
        },
        release: (err) => realClient.release(err)
      };
    };

    try {
      const { req, res } = createMockReqRes({
        user: failUser,
        body: {
          full_name: 'Failed Enqueue Test',
          email: unindexedEmail,
          headline: 'Atomicity Test Headline',
          experience_years: 2,
          resume_text: 'Atomicity resume text',
          skill_json: ['Rust', 'PostgreSQL']
        }
      });

      await createCandidate(req, res);

      // Must fail with 500 error
      assert.equal(res.statusCode, 500);
      assert.match(res.body.message, /SIMULATED_QUEUE_DISK_FAILURE/);

      // CRITICAL CHECK: Verify candidate was NOT persisted into the PostgreSQL candidates table
      const { rows } = await db.query('SELECT id FROM candidates WHERE email = $1', [unindexedEmail]);
      assert.equal(rows.length, 0, 'Candidate must NOT be persisted if queue insertion fails!');
    } finally {
      db.connect = originalConnect;
    }
  });

  it('rolls back candidate profile update when indexing queue insertion fails', async () => {
    // 1. Create a valid candidate first
    const email = `update_audit_${timestamp}@skillverse.test`;
    const { req: cReq, res: cRes } = createMockReqRes({
      user: testUser,
      body: {
        full_name: 'Update Audit Candidate',
        email,
        headline: 'Original Headline',
        experience_years: 1,
        skill_json: ['Python']
      }
    });
    await createCandidate(cReq, cRes);
    assert.equal(cRes.statusCode, 201);
    const candidateId = cRes.body.candidate_id;

    // 2. Attempt update while queue insertion fails
    const originalConnect = db.connect;
    db.connect = async () => {
      const realClient = await pool.connect();
      return {
        query: async (text, params) => {
          if (typeof text === 'string' && (text.includes('INSERT INTO indexing_queue') || text.includes('UPDATE indexing_queue'))) {
            throw new Error('SIMULATED_QUEUE_DEADLOCK');
          }
          return realClient.query(text, params);
        },
        release: (err) => realClient.release(err)
      };
    };

    try {
      const { req: uReq, res: uRes } = createMockReqRes({
        user: testUser,
        body: {
          full_name: 'Update Audit Candidate',
          email,
          headline: 'MODIFIED_SHOULD_ROLLBACK',
          experience_years: 5,
          skill_json: ['Python', 'Django']
        }
      });

      await createCandidate(uReq, uRes);
      assert.equal(uRes.statusCode, 500);

      // Verify the profile was NOT updated in PostgreSQL
      const { rows } = await db.query('SELECT headline, experience_years FROM candidates WHERE id = $1', [candidateId]);
      assert.equal(rows[0].headline, 'Original Headline', 'Update must be rolled back on queue error');
      assert.equal(Number(rows[0].experience_years), 1);
    } finally {
      db.connect = originalConnect;
    }
  });

  it('resets attempts and error idempotently when the same candidate profile is re-saved', async () => {
    const email = `idempotent_${timestamp}@skillverse.test`;
    const { req: sReq, res: sRes } = createMockReqRes({
      body: { name: 'Idempotent User', email, password: 'Password123!', role: 'student' }
    });
    await signup(sReq, sRes);
    const iUser = sRes.body.user;

    const { req: cReq, res: cRes } = createMockReqRes({
      user: iUser,
      body: {
        full_name: 'Idempotent Candidate',
        email,
        headline: 'Version 1',
        skill_json: ['Go']
      }
    });
    await createCandidate(cReq, cRes);
    assert.equal(cRes.statusCode, 201);
    const candidateId = cRes.body.candidate_id;

    // Simulate an indexing failure on that queue entry
    await db.query(
      `UPDATE indexing_queue SET status = 'pending', attempts = 3, last_error = 'Timeout' WHERE candidate_id = $1`,
      [candidateId]
    );

    // Save profile again (triggers enqueueCandidateIndexing)
    const queueItem = await enqueueCandidateIndexing(candidateId);
    assert.ok(queueItem.id);

    // Verify existing pending entry was refreshed rather than creating duplicate active tasks
    const { rows } = await db.query(
      'SELECT id, attempts, last_error FROM indexing_queue WHERE candidate_id = $1 AND status = $2',
      [candidateId, 'pending']
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].attempts, 0, 'Attempts must be reset on re-enqueue');
    assert.equal(rows[0].last_error, null, 'Last error must be cleared on re-enqueue');
  });

  it('guarantees that an eligible persisted profile has a corresponding indexing queue record', async () => {
    // Find any candidate in PostgreSQL and verify queue record exists
    const { rows: candidates } = await db.query('SELECT id FROM candidates ORDER BY id DESC LIMIT 5');
    for (const c of candidates) {
      const { rows: queue } = await db.query('SELECT id, status FROM indexing_queue WHERE candidate_id = $1', [c.id]);
      assert.ok(queue.length >= 1, `Candidate ${c.id} must have at least one indexing_queue entry`);
    }
  });
});
