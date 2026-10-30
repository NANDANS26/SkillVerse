// Backend/src/controllers/companies.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';

/**
 * Helper to resolve the authorized company ID for a user.
 */
async function getAuthorizedCompanyId(user) {
  if (user.role === 'super_admin') {
    const { rows } = await db.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
    return rows[0]?.id || null;
  }
  const { rows } = await db.query(
    'SELECT company_id FROM company_memberships WHERE user_id = $1 LIMIT 1',
    [user.id]
  );
  return rows[0]?.company_id || null;
}

/**
 * GET /api/companies/my-company
 */
export const getMyCompany = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'User is not associated with an enterprise company', 404);
    }

    const { rows } = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!rows[0]) {
      return fail(res, 'Company record not found', 404);
    }

    return ok(res, { company: rows[0] });
  } catch (err) {
    console.error('Get My Company Error:', err);
    return fail(res, 'Failed to fetch company: ' + err.message, 500);
  }
};

/**
 * GET /api/companies/recruiters
 * Scoped to authorized company.
 */
export const getCompanyRecruiters = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'Access denied: No company associated with this user', 403);
    }

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, cm.role as company_role,
              COUNT(j.id)::int as active_jobs_count
       FROM company_memberships cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN jobs j ON j.recruiter_id = u.id AND j.status = 'open'
       WHERE cm.company_id = $1
       GROUP BY u.id, u.name, u.email, cm.role
       ORDER BY u.name ASC`,
      [companyId]
    );

    return ok(res, { recruiters: rows, count: rows.length, company_id: companyId });
  } catch (err) {
    console.error('Get Company Recruiters Error:', err);
    return fail(res, 'Failed to fetch company recruiters: ' + err.message, 500);
  }
};

/**
 * GET /api/companies/jobs
 * Returns requisitions scoped to this company.
 */
export const getCompanyJobs = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'Access denied: No company associated with this user', 403);
    }

    const { rows } = await db.query(
      `SELECT j.*, u.name as recruiter_name, u.email as recruiter_email
       FROM jobs j
       JOIN users u ON j.recruiter_id = u.id
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC`,
      [companyId]
    );

    const jobs = rows.map(j => {
      let parsed = null;
      if (j.parsed_json) {
        parsed = typeof j.parsed_json === 'string' ? JSON.parse(j.parsed_json) : j.parsed_json;
      }
      return {
        ...j,
        parsed_json: parsed
      };
    });

    return ok(res, { jobs, count: jobs.length, company_id: companyId });
  } catch (err) {
    console.error('Get Company Jobs Error:', err);
    return fail(res, 'Failed to fetch company jobs: ' + err.message, 500);
  }
};

/**
 * GET /api/companies/stats
 */
export const getCompanyStats = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'Access denied: No company associated with this user', 403);
    }

    const { rows: comp } = await db.query('SELECT name, industry FROM companies WHERE id = $1', [companyId]);
    const { rows: recruiterCount } = await db.query(
      "SELECT COUNT(*)::int as count FROM company_memberships WHERE company_id = $1 AND role = 'recruiter'",
      [companyId]
    );
    const { rows: totalJobsCount } = await db.query(
      'SELECT COUNT(*)::int as count FROM jobs WHERE company_id = $1',
      [companyId]
    );
    const { rows: openJobsCount } = await db.query(
      "SELECT COUNT(*)::int as count FROM jobs WHERE company_id = $1 AND status = 'open'",
      [companyId]
    );

    return ok(res, {
      company_name: comp[0]?.name || 'Enterprise Partner',
      industry: comp[0]?.industry || 'Technology',
      total_recruiters: recruiterCount[0]?.count || 0,
      total_requisitions: totalJobsCount[0]?.count || 0,
      open_requisitions: openJobsCount[0]?.count || 0
    });
  } catch (err) {
    console.error('Get Company Stats Error:', err);
    return fail(res, 'Failed to fetch company stats: ' + err.message, 500);
  }
};

/**
 * POST /api/companies/recruiters
 * Adds an existing recruiter user to the authorized company.
 */
export const addCompanyRecruiter = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'Access denied: No company associated with this user', 403);
    }

    const { email } = req.body;
    if (!email) {
      return fail(res, 'Recruiter email is required', 400);
    }

    const { rows: userRows } = await db.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!userRows[0]) {
      return fail(res, 'User with this email not found. Recruiters must create an account first.', 404);
    }

    const targetUser = userRows[0];
    if (targetUser.role !== 'recruiter') {
      return fail(res, `Cannot add user with role "${targetUser.role}" as a company recruiter`, 400);
    }

    const { rows: membershipRows } = await db.query(
      `INSERT INTO company_memberships (company_id, user_id, role, created_at)
       VALUES ($1, $2, 'recruiter', CURRENT_TIMESTAMP)
       ON CONFLICT (company_id, user_id) DO UPDATE
       SET role = 'recruiter'
       RETURNING id, company_id, user_id, role, created_at`,
      [companyId, targetUser.id]
    );

    // Record audit event
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ADD_COMPANY_RECRUITER', 'company_membership', $2, $3)`,
      [req.user.id, membershipRows[0].id, JSON.stringify({ company_id: companyId, recruiter_id: targetUser.id, email })]
    );

    return ok(res, {
      message: 'Recruiter added to company successfully',
      recruiter: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        company_role: 'recruiter'
      }
    }, 201);
  } catch (err) {
    console.error('Add Company Recruiter Error:', err);
    return fail(res, 'Failed to add recruiter: ' + err.message, 500);
  }
};

/**
 * DELETE /api/companies/recruiters/:user_id
 * Removes a recruiter from the authorized company.
 */
export const removeCompanyRecruiter = async (req, res) => {
  try {
    const companyId = await getAuthorizedCompanyId(req.user);
    if (!companyId) {
      return fail(res, 'Access denied: No company associated with this user', 403);
    }

    const targetUserId = parseInt(req.params.user_id, 10);

    const { rows } = await db.query(
      "DELETE FROM company_memberships WHERE company_id = $1 AND user_id = $2 AND role = 'recruiter' RETURNING id, company_id, user_id",
      [companyId, targetUserId]
    );

    if (!rows[0]) {
      return fail(res, 'Recruiter membership not found in authorized company', 404);
    }

    // Record audit event
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'REMOVE_COMPANY_RECRUITER', 'company_membership', $2, $3)`,
      [req.user.id, rows[0].id, JSON.stringify({ company_id: companyId, recruiter_id: targetUserId })]
    );

    return ok(res, {
      message: 'Recruiter removed from company successfully',
      deleted_user_id: targetUserId
    });
  } catch (err) {
    console.error('Remove Company Recruiter Error:', err);
    return fail(res, 'Failed to remove recruiter: ' + err.message, 500);
  }
};
