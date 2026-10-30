// Backend/src/controllers/auth.controller.js
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ok, fail } from '../utils/response.js';
import {
  normalizeRole,
  isPublicSignupRole,
  ROLES
} from '../constants/roles.js';

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
}

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role }
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return fail(res, 'All fields (name, email, password, role) are required', 400);
    }

    const requestedRole = normalizeRole(role);

    // Enforce public registration restriction: only students and recruiters can self-register
    if (!isPublicSignupRole(requestedRole)) {
      return fail(
        res,
        `Self-registration is not allowed for role '${role}'. Only Student and Recruiter accounts can be created publicly.`,
        403
      );
    }

    // Check if user already exists
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return fail(res, 'Email already registered', 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert into DB
    const { rows: insertRows } = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.toLowerCase().trim(), password_hash, requestedRole]
    );

    const user = {
      id: insertRows[0].id,
      name: insertRows[0].name,
      email: insertRows[0].email,
      role: insertRows[0].role
    };

    // Generate JWT
    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '1d' });

    setAuthCookie(res, token);

    return ok(res, { user, token }, 201);
  } catch (err) {
    console.error('Signup error:', err);
    return fail(res, 'Signup failed: ' + (err.message || 'Internal error'), 500);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 'Email and password are required', 400);
    }

    // Find user by email
    const { rows } = await db.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return fail(res, 'Invalid credentials', 401);
    }

    const userRow = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      return fail(res, 'Invalid credentials', 401);
    }

    const normalizedRole = normalizeRole(userRow.role);

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: normalizedRole
    };

    // Generate JWT
    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '1d' });

    setAuthCookie(res, token);

    return ok(res, { user, token });
  } catch (err) {
    console.error('Login error:', err);
    return fail(res, 'Login failed: ' + (err.message || 'Internal error'), 500);
  }
};

/**
 * GET /api/auth/me
 * Restores session from token/cookie
 */
export const me = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, 'Unauthorized', 401);
    }

    const { rows } = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return fail(res, 'User not found', 404);
    }

    const user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: normalizeRole(rows[0].role)
    };

    return ok(res, { user });
  } catch (err) {
    console.error('Auth me error:', err);
    return fail(res, 'Session restoration failed', 500);
  }
};

/**
 * POST /api/auth/logout
 * Clears authentication cookie
 */
export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd
  });
  return ok(res, { message: 'Logged out successfully' });
};
