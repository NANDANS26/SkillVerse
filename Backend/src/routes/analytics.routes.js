// Backend/src/routes/analytics.routes.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import {
  getStudentAnalyticsController,
  getCollegeAnalyticsController,
  getFacultyAnalyticsController,
  getWorkforceDemandController,
  getCompanyAnalyticsController,
  getOperationsAnalyticsController
} from '../controllers/analytics.controller.js';
import { getEvaluationReport } from '../controllers/feedback.controller.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/student
 * @desc    Student self-analytics: assessment history, verified skills, and roadmap progress
 * @access  Private (student, super_admin)
 */
router.get(
  '/student',
  authenticate,
  authorizeRoles('student', 'super_admin'),
  getStudentAnalyticsController
);

/**
 * @route   GET /api/analytics/college
 * @desc    College administrator analytics: enrollment, faculty coverage, backlog, skills breakdown
 * @access  Private (college_admin, super_admin)
 */
router.get(
  '/college',
  authenticate,
  authorizeRoles('college_admin', 'super_admin'),
  getCollegeAnalyticsController
);

/**
 * @route   GET /api/analytics/faculty
 * @desc    Faculty analytics: assigned mentees, pending code/project reviews, review decisions
 * @access  Private (faculty, super_admin)
 */
router.get(
  '/faculty',
  authenticate,
  authorizeRoles('faculty', 'super_admin'),
  getFacultyAnalyticsController
);

/**
 * @route   GET /api/analytics/workforce
 * @desc    Workforce demand intelligence: open requisition skill demand vs candidate evidence supply
 * @access  Private (recruiter, company_admin, college_admin, super_admin)
 */
router.get(
  '/workforce',
  authenticate,
  authorizeRoles('recruiter', 'company_admin', 'college_admin', 'super_admin'),
  getWorkforceDemandController
);

/**
 * @route   GET /api/analytics/company
 * @desc    Company administrator analytics: company requisitions, recruiters, and application pipeline
 * @access  Private (company_admin, super_admin)
 */
router.get(
  '/company',
  authenticate,
  authorizeRoles('company_admin', 'super_admin'),
  getCompanyAnalyticsController
);

/**
 * @route   GET /api/analytics/operations
 * @desc    Super administrator operational analytics: user distribution, queue telemetry, model status, audits
 * @access  Private (super_admin)
 */
router.get(
  '/operations',
  authenticate,
  authorizeRoles('super_admin'),
  getOperationsAnalyticsController
);

/**
 * @route   GET /api/analytics/recommendations/evaluation
 * @desc    Recommendation evaluation pipeline: explicit ratings, implicit outcomes, coverage
 * @access  Private (college_admin, super_admin)
 */
router.get(
  '/recommendations/evaluation',
  authenticate,
  authorizeRoles('college_admin', 'super_admin'),
  getEvaluationReport
);

export default router;
