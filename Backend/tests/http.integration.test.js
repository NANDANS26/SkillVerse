// Backend/tests/http.integration.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';

let server;
let baseUrl;

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
});

describe('Live HTTP API Endpoint & Middleware Integration', () => {
  it('serves root service discovery at GET /', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.service, 'SkillVerse Core API');
  });

  it('serves operational healthcheck at GET /health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'skillverse-backend');
  });

  it('blocks privilege escalation on POST /api/auth/signup with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@test.local',
        password: 'Pass12345!',
        role: 'super_admin'
      })
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Self-registration is not allowed/);
  });

  it('rejects unauthenticated access to GET /api/jobs with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it('rejects unauthenticated access to POST /api/jobs with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Lead Engineer', raw_text: 'JD' })
    });
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated access to GET /api/candidates with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/candidates`);
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated access to POST /api/candidates with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Jane Doe', email: 'jane@test.local' })
    });
    assert.equal(res.status, 401);
  });

  it('clears session cookie and responds 200 on POST /api/auth/logout', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Logout must send Set-Cookie header');
    assert.match(setCookie, /token=/);
    assert.match(setCookie, /HttpOnly/i);
  });

  it('returns 404 for non-existent API routes', async () => {
    const res = await fetch(`${baseUrl}/api/non_existent_route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
  });
});
