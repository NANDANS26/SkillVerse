// Backend/src/routes/assessments.routes.js
import express from 'express';
import { 
  listAssessments, 
  getAssessment, 
  submitAttempt, 
  getMyAttempts 
} from '../controllers/assessments.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List available assessments (public/auth)
router.get('/', listAssessments);

// Candidate assessment attempt history
router.get('/me/history', requireAuth, requireRole('student'), getMyAttempts);

// Take assessment (get questions, answer keys omitted)
router.get('/:slug', requireAuth, getAssessment);

// Submit answers for server-side grading
router.post('/:slug/submit', requireAuth, requireRole('student'), submitAttempt);

export default router;
