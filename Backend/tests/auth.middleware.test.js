// Backend/tests/auth.middleware.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authMiddleware, parseCookies } from '../src/middleware/auth.js';
import { env } from '../src/config/env.js';

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe('Auth Middleware & Cookie Parsing', () => {
  it('parses raw cookie strings correctly', () => {
    const raw = 'token=abc123xyz; theme=dark; session=active';
    const parsed = parseCookies(raw);
    assert.equal(parsed.token, 'abc123xyz');
    assert.equal(parsed.theme, 'dark');
    assert.equal(parsed.session, 'active');
  });

  it('rejects unauthenticated requests with 401 when no token is present', () => {
    const req = { headers: {} };
    const res = createMockResponse();
    let nextCalled = false;

    const middleware = authMiddleware();
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
  });

  it('authenticates user via Authorization Bearer header', () => {
    const testUser = { id: 42, name: 'Test Student', email: 'test@student.com', role: 'student' };
    const token = jwt.sign(testUser, env.JWT_SECRET);

    const req = {
      headers: { authorization: `Bearer ${token}` }
    };
    const res = createMockResponse();
    let nextCalled = false;

    const middleware = authMiddleware(['student']);
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 42);
    assert.equal(req.user.role, 'student');
  });

  it('authenticates user via Cookie token when Authorization header is absent', () => {
    const testUser = { id: 99, name: 'Test Recruiter', email: 'recruiter@company.com', role: 'recruiter' };
    const token = jwt.sign(testUser, env.JWT_SECRET);

    const req = {
      headers: { cookie: `token=${token}; theme=light` }
    };
    const res = createMockResponse();
    let nextCalled = false;

    const middleware = authMiddleware(['recruiter']);
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 99);
    assert.equal(req.user.role, 'recruiter');
  });

  it('denies access with 403 Forbidden when user role is not authorized', () => {
    const testUser = { id: 10, name: 'Student Trying Admin', email: 'student@test.com', role: 'student' };
    const token = jwt.sign(testUser, env.JWT_SECRET);

    const req = {
      headers: { authorization: `Bearer ${token}` }
    };
    const res = createMockResponse();
    let nextCalled = false;

    const middleware = authMiddleware(['super_admin']);
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
  });

  it('normalizes legacy role "candidate" to "student" during authorization', () => {
    const testUser = { id: 7, name: 'Legacy Candidate', email: 'legacy@test.com', role: 'candidate' };
    const token = jwt.sign(testUser, env.JWT_SECRET);

    const req = {
      headers: { authorization: `Bearer ${token}` }
    };
    const res = createMockResponse();
    let nextCalled = false;

    const middleware = authMiddleware(['student']);
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.role, 'student');
  });
});
