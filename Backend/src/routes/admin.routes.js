// Backend/src/routes/admin.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getPlatformOverview,
  getIndexingQueue,
  recoverIndexingQueue,
  getAuditLogs,
  getAdminUsers,
  getAdminTenants
} from '../controllers/admin.controller.js';

const router = Router();

// Base auth and super_admin restriction
router.use(requireAuth);
router.use(requireRole(['super_admin']));

router.get('/overview', getPlatformOverview);
router.get('/indexing/queue', getIndexingQueue);
router.post('/indexing/recover', recoverIndexingQueue);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getAdminUsers);
router.get('/tenants', getAdminTenants);

export default router;
