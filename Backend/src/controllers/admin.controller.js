// Backend/src/controllers/admin.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { getQueueStatus, processPendingQueue } from '../services/indexing_queue.service.js';
import { getMLIndexStatus } from '../services/ml.service.js';

/**
 * GET /api/admin/overview
 * Real-time operational platform telemetry derived from authoritative PostgreSQL tables and ML index status.
 */
export const getPlatformOverview = async (_req, res) => {
  try {
    // 1. User counts grouped by canonical role
    const { rows: roleRows } = await db.query(
      'SELECT role, COUNT(*)::int as count FROM users GROUP BY role ORDER BY role ASC'
    );
    const userCounts = {};
    let totalUsers = 0;
    for (const r of roleRows) {
      userCounts[r.role] = r.count;
      totalUsers += r.count;
    }

    // 2. Platform Entity Counts
    const { rows: candidateCount } = await db.query('SELECT COUNT(*)::int as count FROM candidates');
    const { rows: jobCount } = await db.query('SELECT COUNT(*)::int as count FROM jobs');
    const { rows: institutionCount } = await db.query('SELECT COUNT(*)::int as count FROM institutions');
    const { rows: companyCount } = await db.query('SELECT COUNT(*)::int as count FROM companies');

    // 3. Dynamic Indexing Queue Telemetry
    const queueMetrics = await getQueueStatus();

    // 4. ML Vector Index Status
    let mlStatus = null;
    try {
      mlStatus = await getMLIndexStatus();
    } catch (mlErr) {
      mlStatus = { status: 'unavailable', error: mlErr.message };
    }

    return ok(res, {
      platform: 'SkillVerse AI Intelligence Platform',
      timestamp: new Date().toISOString(),
      database_status: 'connected (PostgreSQL 18)',
      users: {
        total: totalUsers,
        by_role: userCounts
      },
      counts: {
        candidates: candidateCount[0]?.count || 0,
        jobs: jobCount[0]?.count || 0,
        institutions: institutionCount[0]?.count || 0,
        companies: companyCount[0]?.count || 0
      },
      indexing_queue: queueMetrics,
      ml_service: mlStatus
    });
  } catch (err) {
    console.error('Get Platform Overview Error:', err);
    return fail(res, 'Failed to fetch platform telemetry: ' + err.message, 500);
  }
};

/**
 * GET /api/admin/indexing/queue
 * Returns items in the PostgreSQL indexing queue.
 */
export const getIndexingQueue = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const { rows } = await db.query(
      `SELECT q.id, q.candidate_id, q.status, q.attempts, q.max_attempts, q.last_error,
              q.created_at, q.updated_at, c.full_name, c.email
       FROM indexing_queue q
       LEFT JOIN candidates c ON q.candidate_id = c.id
       ORDER BY q.id DESC
       LIMIT $1`,
      [limit]
    );

    return ok(res, { queue: rows, count: rows.length });
  } catch (err) {
    console.error('Get Indexing Queue Error:', err);
    return fail(res, 'Failed to fetch indexing queue: ' + err.message, 500);
  }
};

/**
 * POST /api/admin/indexing/recover
 * Manually triggers the durable indexing queue recovery worker.
 */
export const recoverIndexingQueue = async (_req, res) => {
  try {
    const result = await processPendingQueue(50);

    // Record audit event
    await db.query(
      `INSERT INTO audit_logs (action, entity_type, details)
       VALUES ('RECOVER_INDEXING_QUEUE', 'indexing_worker', $1)`,
      [JSON.stringify(result)]
    );

    return ok(res, {
      message: 'Indexing recovery executed successfully',
      result
    });
  } catch (err) {
    console.error('Recover Indexing Queue Error:', err);
    return fail(res, 'Failed to recover indexing queue: ' + err.message, 500);
  }
};

/**
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const { rows } = await db.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
              u.name as actor_name, u.email as actor_email, u.role as actor_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return ok(res, { audit_logs: rows, count: rows.length });
  } catch (err) {
    console.error('Get Audit Logs Error:', err);
    return fail(res, 'Failed to fetch audit logs: ' + err.message, 500);
  }
};

/**
 * GET /api/admin/users
 * Lists user accounts for super administrator governance (passwords strictly excluded).
 */
export const getAdminUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const { rows } = await db.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return ok(res, { users: rows, count: rows.length });
  } catch (err) {
    console.error('Get Admin Users Error:', err);
    return fail(res, 'Failed to fetch users: ' + err.message, 500);
  }
};

/**
 * GET /api/admin/tenants
 * Lists institutions and companies with tenancy details.
 */
export const getAdminTenants = async (_req, res) => {
  try {
    const { rows: institutions } = await db.query(
      `SELECT i.id, i.name, i.code, i.created_at,
              COUNT(DISTINCT CASE WHEN im.role = 'student' THEN im.user_id END)::int as student_count,
              COUNT(DISTINCT CASE WHEN im.role = 'faculty' THEN im.user_id END)::int as faculty_count
       FROM institutions i
       LEFT JOIN institution_memberships im ON i.id = im.institution_id
       GROUP BY i.id, i.name, i.code, i.created_at
       ORDER BY i.name ASC`
    );

    const { rows: companies } = await db.query(
      `SELECT c.id, c.name, c.industry, c.created_at,
              COUNT(DISTINCT cm.user_id)::int as recruiter_count,
              COUNT(DISTINCT j.id)::int as job_count
       FROM companies c
       LEFT JOIN company_memberships cm ON c.id = cm.company_id
       LEFT JOIN jobs j ON c.id = j.company_id
       GROUP BY c.id, c.name, c.industry, c.created_at
       ORDER BY c.name ASC`
    );

    return ok(res, {
      institutions,
      companies,
      total_institutions: institutions.length,
      total_companies: companies.length
    });
  } catch (err) {
    console.error('Get Admin Tenants Error:', err);
    return fail(res, 'Failed to fetch tenants: ' + err.message, 500);
  }
};
