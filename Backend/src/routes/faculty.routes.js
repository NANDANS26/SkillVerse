// Backend/src/routes/faculty.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getMyAssignedStudents,
  getAssignedStudentDetails,
  updateMentorshipNotes,
  getFacultyStats
} from '../controllers/faculty.controller.js';
import {
  getPendingFacultyEvidence,
  reviewEvidence
} from '../controllers/skills.controller.js';

const router = Router();

// Base auth and role enforcement
router.use(requireAuth);
router.use(requireRole(['faculty', 'super_admin']));

router.get('/students', getMyAssignedStudents);
router.get('/student/:id', getAssignedStudentDetails);
router.patch('/student/:id/notes', updateMentorshipNotes);
router.get('/stats', getFacultyStats);

// Evidence Review
router.get('/pending-evidence', getPendingFacultyEvidence);
router.patch('/evidence/:id/review', reviewEvidence);

export default router;
