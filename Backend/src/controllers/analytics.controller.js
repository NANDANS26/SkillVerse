// Backend/src/controllers/analytics.controller.js
import { ok, fail } from '../utils/response.js';
import {
  getStudentAnalytics,
  getCollegeAdminAnalytics,
  getFacultyAnalytics,
  getWorkforceDemandAnalytics,
  getCompanyAdminAnalytics,
  getOperationalAnalytics
} from '../services/analytics.service.js';

/**
 * GET /api/analytics/student
 * Authorized student analytics derived from their own assessments, evidence, and roadmaps.
 */
export async function getStudentAnalyticsController(req, res) {
  try {
    const data = await getStudentAnalytics(req.user.id);
    return ok(res, data);
  } catch (err) {
    console.error('Student Analytics Error:', err);
    return fail(res, 'Failed to fetch student analytics: ' + err.message, 500);
  }
}

/**
 * GET /api/analytics/college
 * Authorized college administrator analytics scoped strictly to their institution.
 */
export async function getCollegeAnalyticsController(req, res) {
  try {
    const data = await getCollegeAdminAnalytics(req.user);
    return ok(res, data);
  } catch (err) {
    console.error('College Admin Analytics Error:', err);
    return fail(res, 'Failed to fetch college analytics: ' + err.message, 500);
  }
}

/**
 * GET /api/analytics/faculty
 * Authorized faculty analytics scoped to assigned mentees and pending reviews.
 */
export async function getFacultyAnalyticsController(req, res) {
  try {
    const data = await getFacultyAnalytics(req.user);
    return ok(res, data);
  } catch (err) {
    console.error('Faculty Analytics Error:', err);
    return fail(res, 'Failed to fetch faculty analytics: ' + err.message, 500);
  }
}

/**
 * GET /api/analytics/workforce
 * Workforce skill demand and observable candidate supply intelligence.
 */
export async function getWorkforceDemandController(req, res) {
  try {
    const filters = {};
    if (req.query.company_id) {
      filters.company_id = parseInt(req.query.company_id, 10);
    }
    const data = await getWorkforceDemandAnalytics(req.user, filters);
    return ok(res, data);
  } catch (err) {
    console.error('Workforce Analytics Error:', err);
    return fail(res, 'Failed to fetch workforce demand analytics: ' + err.message, 500);
  }
}

/**
 * GET /api/analytics/company
 * Company administrator analytics scoped to company requisitions, recruiters, and pipeline.
 */
export async function getCompanyAnalyticsController(req, res) {
  try {
    const data = await getCompanyAdminAnalytics(req.user);
    return ok(res, data);
  } catch (err) {
    console.error('Company Admin Analytics Error:', err);
    return fail(res, 'Failed to fetch company analytics: ' + err.message, 500);
  }
}

/**
 * GET /api/analytics/operations
 * Super administrator operational telemetry across users, queues, models, and audit logs.
 */
export async function getOperationsAnalyticsController(_req, res) {
  try {
    const data = await getOperationalAnalytics();
    return ok(res, data);
  } catch (err) {
    console.error('Operations Analytics Error:', err);
    return fail(res, 'Failed to fetch platform operations analytics: ' + err.message, 500);
  }
}
