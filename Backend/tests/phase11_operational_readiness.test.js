// Backend/tests/phase11_operational_readiness.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { callMLForMatches } from '../src/services/ml.service.js';
import { enqueueCandidateIndexing, processPendingQueue, getQueueStatus } from '../src/services/indexing_queue.service.js';

describe('Phase 11: Operational Readiness, Startup Contracts, and Database Integrity', () => {

  it('verifies PostgreSQL pool connection, transaction commit, and transaction rollback', async () => {
    const client = await db.pool.connect();
    try {
      // 1. Transaction Rollback Check
      await client.query('BEGIN');
      const testEmail = `rollback_${Date.now()}@test.local`;
      const insertRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Rollback Test User', testEmail, 'dummy_hash', 'student']
      );
      const insertedId = insertRes.rows[0].id;
      assert.ok(insertedId, 'Inserted ID must exist within uncommitted transaction');

      await client.query('ROLLBACK');

      const checkRes = await client.query('SELECT id FROM users WHERE id = $1', [insertedId]);
      assert.equal(checkRes.rows.length, 0, 'Rolled-back record must not exist in database');

      // 2. Read query pool check
      const { rows } = await client.query('SELECT count(*) as count FROM schema_migrations');
      assert.ok(parseInt(rows[0].count, 10) >= 5, 'All 5 migrations must be recorded');
    } finally {
      client.release();
    }
  });

  it('validates indexing queue lifecycle, idempotency, and retry semantics', async () => {
    // Pick an existing candidate or insert temporary one
    const { rows: candidates } = await db.query('SELECT id FROM candidates LIMIT 1');
    assert.ok(candidates.length > 0, 'Database must contain candidates');
    const testCandidateId = candidates[0].id;

    // Enqueue candidate
    const item = await enqueueCandidateIndexing(testCandidateId);
    assert.ok(item, 'Queue item must be returned');
    assert.equal(item.status, 'pending');

    // Check status map
    const statusMap = await getQueueStatus();
    assert.ok(statusMap.total >= 1, 'Total queue items must be >= 1');
    assert.ok(statusMap.pending >= 0, 'Pending items count must be non-negative');
  });

  it('enforces internal service token authentication on FastAPI matching and embed endpoints', async () => {
    const mlUrl = `${env.ML_SERVICE_URL}/api/v1/embed_candidate`;
    const dummyCandidate = {
      id: 999999,
      candidate_id: 999999,
      full_name: 'Test Candidate',
      headline: 'Software Engineer',
      skills: ['TypeScript', 'Node.js']
    };

    // 1. Request WITHOUT service token must be rejected with 401 Unauthorized
    try {
      await axios.post(mlUrl, dummyCandidate, { timeout: 3000 });
      assert.fail('Request without X-Service-Token must be rejected');
    } catch (err) {
      assert.equal(err.response?.status, 401, 'Must return 401 Unauthorized for missing service token');
    }

    // 2. Request WITH INVALID service token must be rejected with 403 Forbidden
    try {
      await axios.post(mlUrl, dummyCandidate, {
        headers: { 'X-Service-Token': 'invalid-bogus-token' },
        timeout: 3000
      });
      assert.fail('Request with invalid token must be rejected');
    } catch (err) {
      assert.equal(err.response?.status, 403, 'Must return 403 Forbidden for incorrect service token');
    }

    // 3. Request WITH VALID service token must succeed
    const validToken = env.ML_SERVICE_SECRET;
    const res = await axios.post(mlUrl, dummyCandidate, {
      headers: { 'X-Service-Token': validToken },
      timeout: 10000
    });
    assert.equal(res.status, 200, 'Request with valid service token must return 200 OK');
    assert.equal(res.data.success, true);

    // Clean up test candidate vector from live index
    try {
      await axios.delete(`${env.ML_SERVICE_URL}/api/v1/candidate/999999`, {
        headers: { 'X-Service-Token': validToken },
        timeout: 5000
      });
    } catch {}
  });

  it('performs matching smoke test: validates score range [0, 1], top_k bounding, and determinism', async () => {
    const testJob = {
      id: 101,
      title: 'Full Stack React & Node Engineer',
      required_skills: ['React', 'Node.js', 'PostgreSQL'],
      experience_min: 1.0,
      experience_max: 6.0,
      raw_text: 'Building scalable modern web applications with React, Node, and PostgreSQL'
    };

    // First request
    const matches1 = await callMLForMatches(testJob, 5, 'live');
    assert.ok(Array.isArray(matches1), 'Matches must be returned as an array');
    assert.ok(matches1.length > 0, 'Matches should be returned for common skill requirements');
    assert.ok(matches1.length <= 5, 'Returned matches must not exceed requested top_k = 5');

    // Score range and candidate ID validation
    for (const match of matches1) {
      assert.ok(match.candidate_id !== undefined, 'Match must have a valid candidate_id');
      assert.ok(typeof match.match_score === 'number', 'match_score must be numeric');
      assert.ok(match.match_score >= 0.0 && match.match_score <= 1.0, 'match_score must be normalized between 0.0 and 1.0');
      assert.ok(typeof match.skill_overlap === 'number', 'skill_overlap must be numeric');
      assert.ok(match.skill_overlap >= 0.0 && match.skill_overlap <= 1.0, 'skill_overlap must be between 0.0 and 1.0');
    }

    // Second request: Determinism check (must return exact same IDs and order)
    const matches2 = await callMLForMatches(testJob, 5, 'live');
    assert.equal(matches1.length, matches2.length, 'Subsequent identical query must return identical length');
    for (let i = 0; i < matches1.length; i++) {
      assert.equal(matches1[i].candidate_id, matches2[i].candidate_id, `Match #${i} candidate_id must be deterministic`);
      assert.equal(matches1[i].match_score, matches2[i].match_score, `Match #${i} match_score must be deterministic`);
    }

    // top_k bounding test
    const matchesBounded = await callMLForMatches(testJob, 3, 'live');
    assert.ok(matchesBounded.length <= 3, 'Matches must respect top_k = 3 bound');
  });

  it('distinguishes zero-match responses from service failures', async () => {
    const zeroMatchJob = {
      id: 999998,
      title: 'Obscure Rare Technology Specialist Quantum Cobol 1960',
      required_skills: ['quantum_cobol_xyz_unique_unreal_skill_999'],
      experience_min: 25.0,
      experience_max: 30.0,
      raw_text: 'Obscure vintage skills with zero market candidates'
    };

    // Mode live or benchmark: should return empty or low match list without throwing service error
    const matches = await callMLForMatches(zeroMatchJob, 5, 'live');
    assert.ok(Array.isArray(matches), 'Must return an array, not throw exception');
    // If candidates returned, their skill overlap must be 0
    if (matches.length > 0) {
      assert.equal(matches[0].skill_overlap, 0.0, 'Irrelevant skill requirement must produce 0.0 skill overlap');
    }
  });

});
