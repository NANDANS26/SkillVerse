// Backend/tests/ml.contract.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { callMLForMatches } from '../src/services/ml.service.js';

describe('AI/ML Service Contract & Error Propagation', () => {
  it('throws descriptive error instead of silently returning empty array when ML service is offline', async () => {
    const mockJob = {
      id: 101,
      title: 'Full Stack Engineer',
      required_skills: ['React', 'Node.js'],
      experience_min: 2,
      experience_max: 5,
      raw_text: 'Looking for a senior developer'
    };

    // ML service on unreachable port 59999
    const prev = process.env.ML_SERVICE_URL;
    process.env.ML_SERVICE_URL = 'http://127.0.0.1:59999';

    try {
      await assert.rejects(
        async () => {
          await callMLForMatches(mockJob);
        },
        (err) => {
          assert.match(err.message, /AI Matching Service Error/);
          return true;
        }
      );
    } finally {
      process.env.ML_SERVICE_URL = 'http://127.0.0.1:8000';
    }
  });
});
