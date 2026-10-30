import { Router } from 'express';
import { getAuditLogs, getAuditStats } from '../controllers/auditController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Restrict all audit log routes to Owner and Admin
router.use(protect);
router.use(requireRole(['Owner', 'Admin']));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
