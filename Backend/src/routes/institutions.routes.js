// Backend/src/routes/institutions.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getMyInstitution,
  getInstitutionStudents,
  getInstitutionFaculty,
  assignFacultyToStudent,
  getInstitutionAssignments,
  unassignFacultyFromStudent,
  getInstitutionStats
} from '../controllers/institutions.controller.js';

const router = Router();

// Base auth required for all routes
router.use(requireAuth);

router.get('/my-institution', getMyInstitution);
router.get('/students', requireRole(['college_admin', 'faculty', 'super_admin']), getInstitutionStudents);
router.get('/faculty', requireRole(['college_admin', 'super_admin']), getInstitutionFaculty);
router.get('/assignments', requireRole(['college_admin', 'super_admin']), getInstitutionAssignments);
router.post('/assign-faculty', requireRole(['college_admin', 'super_admin']), assignFacultyToStudent);
router.delete('/assignments/:id', requireRole(['college_admin', 'super_admin']), unassignFacultyFromStudent);
router.get('/stats', requireRole(['college_admin', 'super_admin']), getInstitutionStats);

export default router;
