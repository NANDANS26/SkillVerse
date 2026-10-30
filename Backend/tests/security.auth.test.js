// Backend/tests/security.auth.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { signup, login, me, logout } from '../src/controllers/auth.controller.js';
import { authMiddleware } from '../src/middleware/auth.js';
import { env } from '../src/config/env.js';
import { db } from '../src/config/db.js';

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

describe('Privilege Escalation Defense Suite', () => {
  it('rejects public signup attempting to create super_admin with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker@evil.test',
        password: 'Password123!',
        role: 'super_admin'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Self-registration is not allowed for role/);
  });

  it('rejects public signup attempting to create admin with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker2@evil.test',
        password: 'Password123!',
        role: 'admin'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('rejects public signup attempting to create college_admin with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker3@evil.test',
        password: 'Password123!',
        role: 'college_admin'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('rejects public signup attempting to create faculty with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker4@evil.test',
        password: 'Password123!',
        role: 'faculty'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('rejects public signup attempting to create company_admin with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker5@evil.test',
        password: 'Password123!',
        role: 'company_admin'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('rejects public signup with unrecognized or garbage role with 403 Forbidden', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attacker',
        email: 'attacker6@evil.test',
        password: 'Password123!',
        role: 'root_superuser_exploit'
      }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('rejects signup with missing required fields with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes({
      body: { email: 'incomplete@test.com', password: '123' }
    });

    await signup(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });
});

describe('Token Tampering & Expired Session Defense', () => {
  it('rejects token signed with an invalid secret with 401', () => {
    const maliciousToken = jwt.sign(
      { id: 1, role: 'super_admin' },
      'wrong-attacker-secret'
    );

    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${maliciousToken}` }
    });
    let nextCalled = false;

    const middleware = authMiddleware();
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
  });

  it('rejects expired token with 401', () => {
    const expiredToken = jwt.sign(
      { id: 1, role: 'student', exp: Math.floor(Date.now() / 1000) - 3600 },
      env.JWT_SECRET
    );

    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${expiredToken}` }
    });
    let nextCalled = false;

    const middleware = authMiddleware();
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
  });

  it('clears session cookie on logout', async () => {
    const { req, res } = createMockReqRes();

    await logout(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.clearedCookie.name, 'token');
    assert.equal(res.clearedCookie.options.httpOnly, true);
    assert.equal(res.clearedCookie.options.sameSite, 'lax');
  });
});
