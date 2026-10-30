import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import WebhookDelivery from '../models/WebhookDelivery.js';
import { recordAuditLog } from '../services/auditService.js';

export const GITHUB_WEBHOOK_SECRET =
  process.env.GITHUB_WEBHOOK_SECRET || 'teamsync_github_webhook_secret_2026';

/**
 * Validates GitHub HMAC-SHA256 signature (X-Hub-Signature-256)
 */
export const verifyGitHubSignature = async (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const deliveryId =
    req.headers['x-github-delivery'] || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const event = req.headers['x-github-event'] || 'pull_request';
  const ipAddress =
    req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  // If no signature header provided
  if (!signature) {
    await WebhookDelivery.create({
      deliveryId,
      event,
      status: 'VERIFICATION_FAILED',
      summary: 'Missing X-Hub-Signature-256 header',
      signatureValid: false,
      ipAddress,
    }).catch(() => {});

    return next(
      new ApiError(401, 'Unauthorized Webhook: Missing X-Hub-Signature-256 header')
    );
  }

  try {
    const rawPayload = req.rawBody || JSON.stringify(req.body || {});
    const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
    hmac.update(rawPayload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    // Safe comparison to guard against timing attacks
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      await WebhookDelivery.create({
        deliveryId,
        event,
        status: 'VERIFICATION_FAILED',
        summary: 'Invalid HMAC SHA-256 cryptographic signature',
        signatureValid: false,
        ipAddress,
      }).catch(() => {});

      await recordAuditLog({
        actor: { name: 'Unknown Webhook Client', email: 'unauthorized@external.api', role: 'Guest' },
        action: 'SECURITY_UNAUTHORIZED_ACCESS',
        resourceType: 'Security',
        details: {
          error: 'HMAC signature mismatch on /api/webhooks/github',
          deliveryId,
        },
        ipAddress,
        status: 'DENIED',
      });

      return next(
        new ApiError(401, 'Unauthorized Webhook: Invalid cryptographic signature')
      );
    }

    req.deliveryId = deliveryId;
    req.githubEvent = event;
    next();
  } catch (err) {
    return next(
      new ApiError(500, `Webhook signature verification failed: ${err.message}`)
    );
  }
};
