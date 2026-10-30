// Backend/src/routes/candidates.routes.js
import { Router } from 'express';
import {
  createCandidate,
  getCandidate,
  getMyCandidateProfile,
  getMyApplications,
  listCandidates
} from '../controllers/candidates.controller.js';
import { 
  getMySkillDNA, 
  getCandidateSkillDNAById, 
  submitEvidence, 
  getMyEvidence 
} from '../controllers/skills.controller.js';
import { getMyAttempts } from '../controllers/assessments.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Student (or super_admin) can save/update their profile
router.post('/', authMiddleware(['student', 'super_admin']), createCandidate);

// Authenticated user can fetch their own candidate profile
router.get('/me', authMiddleware(['student', 'super_admin']), getMyCandidateProfile);

// Authenticated student can fetch their submitted job applications
router.get('/me/applications', authMiddleware(['student', 'super_admin']), getMyApplications);

// Authenticated student Skill DNA & Evidence
router.get('/me/skill-dna', authMiddleware(['student', 'super_admin']), getMySkillDNA);
router.post('/me/evidence', authMiddleware(['student', 'super_admin']), submitEvidence);
router.get('/me/evidence', authMiddleware(['student', 'super_admin']), getMyEvidence);
router.get('/me/assessments', authMiddleware(['student', 'super_admin']), getMyAttempts);

// Recruiter or super_admin can list all candidates
router.get('/', authMiddleware(['recruiter', 'super_admin']), listCandidates);

// Authenticated users can view a candidate (with privacy checks in controller)
router.get('/:id', authMiddleware(['student', 'recruiter', 'super_admin']), getCandidate);
router.get('/:id/skill-dna', authMiddleware(['student', 'faculty', 'recruiter', 'college_admin', 'super_admin']), getCandidateSkillDNAById);

export default router;
