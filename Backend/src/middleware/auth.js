// Backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { normalizeRole } from '../constants/roles.js';

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rawVal] = part.trim().split('=');
    if (rawKey) {
      try {
        cookies[rawKey] = decodeURIComponent(rawVal.join('='));
      } catch {
        cookies[rawKey] = rawVal.join('=');
      }
    }
  }
  return cookies;
}

export const authMiddleware = (allowedRoles = []) => {
  const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedAllowedRoles = rolesList.map(r => normalizeRole(r));

  return (req, res, next) => {
    // 1. Try Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token) {
      const cookies = req.cookies || parseCookies(req.headers.cookie);
      if (cookies.token) {
        token = cookies.token;
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required: No token provided' });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const normalizedUserRole = normalizeRole(decoded.role);

      if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedUserRole)) {
        return res.status(403).json({
          success: false,
          message: `Access forbidden: Role '${normalizedUserRole}' does not have required permissions`
        });
      }

      req.user = {
        ...decoded,
        role: normalizedUserRole
      };
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Authentication failed: Invalid or expired token' });
    }
  };
};

export const requireAuth = (req, res, next) => authMiddleware()(req, res, next);
export const requireRole = (allowedRoles) => authMiddleware(allowedRoles);
export const authenticate = requireAuth;
export const authorizeRoles = (...roles) => authMiddleware(roles.flat());

