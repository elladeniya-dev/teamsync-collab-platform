import { Router } from 'express';
import {
  handleGitHubWebhook,
  getWebhookDeliveries,
  getWebhookStats,
  simulateWebhook,
} from '../controllers/webhookController.js';
import { verifyGitHubSignature } from '../middlewares/webhookMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Public Inbound GitHub Webhook Receiver (protected cryptographically via HMAC-SHA256)
router.post('/github', verifyGitHubSignature, handleGitHubWebhook);

// Protected Management & Testing Endpoints
router.get('/deliveries', protect, requireRole(['Owner', 'Admin']), getWebhookDeliveries);
router.get('/stats', protect, requireRole(['Owner', 'Admin']), getWebhookStats);
router.post('/simulate', protect, requireRole(['Owner', 'Admin', 'Member']), simulateWebhook);

export default router;
