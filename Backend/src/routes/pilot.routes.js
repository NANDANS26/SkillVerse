// Backend/src/routes/pilot.routes.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  postCreateProgram,
  getListPrograms,
  getProgramDetails,
  patchProgramStatus,
  postStudentConsent,
  postStudentWithdraw,
  getStudentStatus
} from '../controllers/pilot.controller.js';

const router = express.Router();

// Program Administration
router.post('/programs', requireAuth, postCreateProgram);
router.get('/programs', requireAuth, getListPrograms);
router.get('/programs/:id', requireAuth, getProgramDetails);
router.patch('/programs/:id/status', requireAuth, patchProgramStatus);

// Student Voluntary Participation & Consent
router.post('/consent', requireAuth, postStudentConsent);
router.post('/withdraw', requireAuth, postStudentWithdraw);
router.get('/status', requireAuth, getStudentStatus);

export default router;
