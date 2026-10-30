import { asyncHandler } from '../utils/asyncHandler.js';
import * as webhookService from '../services/webhookService.js';

/**
 * Inbound GitHub Webhook Receiver
 * Route: POST /api/webhooks/github
 * Access: Public with HMAC-SHA256 signature verification
 */
export const handleGitHubWebhook = asyncHandler(async (req, res) => {
  const ipAddress =
    req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  const result = await webhookService.processGitHubWebhook({
    deliveryId: req.deliveryId,
    event: req.githubEvent,
    payload: req.body,
    ipAddress,
  });

  res.status(200).json(result);
});

/**
 * Get Webhook Delivery Logs
 * Route: GET /api/webhooks/deliveries
 * Access: Private (Owner, Admin)
 */
export const getWebhookDeliveries = asyncHandler(async (req, res) => {
  const result = await webhookService.fetchWebhookDeliveries(req.query);
  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Get Webhook Statistics
 * Route: GET /api/webhooks/stats
 * Access: Private (Owner, Admin)
 */
export const getWebhookStats = asyncHandler(async (req, res) => {
  const stats = await webhookService.fetchWebhookStats();
  res.status(200).json({
    success: true,
    stats,
  });
});

/**
 * Simulate GitHub PR Merge (Testing / Demo Endpoint)
 * Route: POST /api/webhooks/simulate
 * Access: Private (Owner, Admin, Member)
 */
export const simulateWebhook = asyncHandler(async (req, res) => {
  const { taskId, prTitle, prNumber, githubAuthor, deliveryId } = req.body;

  const result = await webhookService.simulateGitHubPRMerge({
    taskId,
    prTitle,
    prNumber: prNumber ? parseInt(prNumber, 10) : 42,
    githubAuthor: githubAuthor || 'octocat',
    deliveryId,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});
