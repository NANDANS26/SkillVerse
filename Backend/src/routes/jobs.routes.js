// Backend/src/routes/jobs.routes.js
import { Router } from 'express';
import {
  createJob,
  getJob,
  getMatches,
  listJobs,
  applyToJob,
  getJobApplications,
  updateApplicationStatus
} from '../controllers/jobs.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// List jobs (recruiter sees their jobs, student sees open jobs, super_admin sees all)
router.get('/', authMiddleware(['recruiter', 'student', 'super_admin']), listJobs);

// Create job (recruiter or super_admin only)
router.post('/', authMiddleware(['recruiter', 'super_admin']), createJob);

// Get job details (any authenticated user)
router.get('/:id', authMiddleware(['recruiter', 'student', 'super_admin']), getJob);

// Get AI candidate matches for a job (recruiter or super_admin, with ownership check)
router.get('/:id/matches', authMiddleware(['recruiter', 'super_admin']), getMatches);

// Apply to a job (student only)
router.post('/:id/apply', authMiddleware(['student']), applyToJob);

// View applications for a job (recruiter or super_admin with ownership check)
router.get('/:id/applications', authMiddleware(['recruiter', 'super_admin']), getJobApplications);

// Update application status (recruiter or super_admin with ownership check)
router.patch('/:id/applications/:appId', authMiddleware(['recruiter', 'super_admin']), updateApplicationStatus);

export default router;
