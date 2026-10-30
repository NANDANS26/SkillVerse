// Backend/src/routes/skills.routes.js
import express from 'express';
import { 
  listSkills, 
  getMySkillDNA, 
  getCandidateSkillDNAById, 
  submitEvidence, 
  getMyEvidence,
  getPendingFacultyEvidence,
  reviewEvidence
} from '../controllers/skills.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Canonical skill taxonomy
router.get('/', listSkills);

// Skill DNA Evaluation
router.get('/me/dna', requireAuth, requireRole('student'), getMySkillDNA);
router.get('/:id/dna', requireAuth, getCandidateSkillDNAById);

// Student evidence submission
router.post('/me/evidence', requireAuth, requireRole('student'), submitEvidence);
router.get('/me/evidence', requireAuth, requireRole('student'), getMyEvidence);

// Faculty evidence review
router.get('/faculty/pending', requireAuth, requireRole('faculty'), getPendingFacultyEvidence);
router.patch('/faculty/evidence/:id/review', requireAuth, requireRole('faculty'), reviewEvidence);

export default router;
