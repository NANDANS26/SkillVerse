// Backend/src/routes/companies.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getMyCompany,
  getCompanyRecruiters,
  addCompanyRecruiter,
  removeCompanyRecruiter,
  getCompanyJobs,
  getCompanyStats
} from '../controllers/companies.controller.js';

const router = Router();

// Base auth and role enforcement
router.use(requireAuth);
router.use(requireRole(['company_admin', 'recruiter', 'super_admin']));

router.get('/my-company', getMyCompany);
router.get('/recruiters', requireRole(['company_admin', 'super_admin']), getCompanyRecruiters);
router.post('/recruiters', requireRole(['company_admin', 'super_admin']), addCompanyRecruiter);
router.delete('/recruiters/:user_id', requireRole(['company_admin', 'super_admin']), removeCompanyRecruiter);
router.get('/jobs', requireRole(['company_admin', 'super_admin']), getCompanyJobs);
router.get('/stats', requireRole(['company_admin', 'super_admin']), getCompanyStats);

export default router;
