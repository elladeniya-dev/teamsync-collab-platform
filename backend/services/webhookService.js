import crypto from 'crypto';
import WebhookDelivery from '../models/WebhookDelivery.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { recordAuditLog } from './auditService.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { GITHUB_WEBHOOK_SECRET } from '../middlewares/webhookMiddleware.js';

/**
 * Dispatches an outbound notification to Slack or Discord webhook if configured
 */
export const dispatchOutboundSlackNotification = async (message, details = {}) => {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) return;

  try {
    const payload = {
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*TeamSync Automation Notice*\n${message}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Event:* GitHub PR Integration | *Time:* ${new Date().toLocaleTimeString()}`,
            },
          ],
        },
      ],
    };

    await fetch(slackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[WebhookService] Outbound Slack dispatch skipped:', err.message);
  }
};

/**
 * Finds a matching task given PR title, body, and branch name
 */
const findMatchingTask = async (prTitle = '', prBody = '', branchName = '') => {
  const combinedText = `${prTitle} ${prBody} ${branchName}`.toLowerCase();

  // 1. Look for explicit Mongo ObjectId pattern (24 hex characters)
  const hexMatches = combinedText.match(/[0-9a-fA-F]{24}/g);
  if (hexMatches && hexMatches.length > 0) {
    for (const hexId of hexMatches) {
      const task = await Task.findById(hexId);
      if (task) return task;
    }
  }

  // 2. Fetch active tasks that are not yet marked Done
  const activeTasks = await Task.find({ status: { $ne: 'Done' } }).sort({ deadline: 1 });

  // 3. Check for exact or high-confidence substring matching on task titles
  for (const task of activeTasks) {
    const cleanTitle = task.title.trim().toLowerCase();
    if (cleanTitle.length > 3 && combinedText.includes(cleanTitle)) {
      return task;
    }

    // Check slugified title (e.g. "user-authentication" in branch)
    const slugTitle = cleanTitle.replace(/[^a-z0-9]+/g, '-');
    if (slugTitle.length > 4 && combinedText.includes(slugTitle)) {
      return task;
    }
  }

  // Fallback: If no match found among active tasks, search all tasks
  const allTasks = await Task.find().sort({ updatedAt: -1 });
  for (const task of allTasks) {
    const cleanTitle = task.title.trim().toLowerCase();
    if (cleanTitle.length > 3 && combinedText.includes(cleanTitle)) {
      return task;
    }
  }

  return null;
};

/**
 * Process inbound GitHub Webhook with Idempotency Guarantees
 */
export const processGitHubWebhook = async ({
  deliveryId,
  event,
  payload,
  ipAddress = '127.0.0.1',
}) => {
  // --- 1. IDEMPOTENCY CHECK ---
  // Replay attack / duplicate delivery prevention
  const existingDelivery = await WebhookDelivery.findOne({ deliveryId });
  if (existingDelivery) {
    // Record duplicate encounter without repeating any business side-effects
    return {
      success: true,
      idempotent: true,
      duplicate: true,
      message: `Delivery [${deliveryId}] was already processed at ${existingDelivery.createdAt.toISOString()}. Idempotent skip executed.`,
      status: existingDelivery.status,
      summary: existingDelivery.summary,
      matchedTaskId: existingDelivery.matchedTaskId,
    };
  }

  const sender = payload.sender?.login || 'github-actions';
  const repository = payload.repository?.full_name || 'teamsync/collab-platform';

  // --- 2. HANDLE PING EVENT ---
  if (event === 'ping') {
    const delivery = await WebhookDelivery.create({
      deliveryId,
      event,
      sender,
      repository,
      status: 'PROCESSED',
      summary: 'GitHub Ping webhook handshake verified successfully.',
      signatureValid: true,
      ipAddress,
      payloadSnippet: { zen: payload.zen, hook_id: payload.hook_id },
    });

    broadcastEvent('webhook:delivery', delivery);

    return {
      success: true,
      idempotent: false,
      message: 'GitHub webhook ping received and verified successfully.',
    };
  }

  // --- 3. HANDLE PULL_REQUEST EVENT ---
  if (event === 'pull_request') {
    const action = payload.action;
    const pr = payload.pull_request || {};
    const isMerged = Boolean(pr.merged);
    const prNumber = pr.number;
    const prTitle = pr.title || 'Untitled Pull Request';
    const prBody = pr.body || '';
    const prUrl = pr.html_url || '';
    const headBranch = pr.head?.ref || '';
    const mergedBy = pr.merged_by?.login || sender;

    // We only automate task transitions when PR is merged
    if (action === 'closed' && isMerged) {
      const matchedTask = await findMatchingTask(prTitle, prBody, headBranch);

      if (matchedTask) {
        const previousStatus = matchedTask.status || 'In Progress';
        matchedTask.status = 'Done';
        matchedTask.githubPrUrl = prUrl;
        matchedTask.githubPrNumber = prNumber;
        matchedTask.completedAt = new Date();
        await matchedTask.save();

        // Real-time broadcast to all connected clients
        broadcastEvent('task:updated', matchedTask);

        // Notification to team members
        try {
          const notif = await Notification.create({
            title: `GitHub PR #${prNumber} Merged`,
            message: `Task "${matchedTask.title}" was automatically moved to Done via merged PR #${prNumber} by @${mergedBy}.`,
            type: 'task',
            priority: 'high',
            link: '/tasks',
            metadata: {
              taskId: matchedTask._id.toString(),
              prUrl,
              prNumber,
            },
          });
          broadcastEvent('notification:new', notif);
        } catch (notifErr) {
          console.warn('[WebhookService] Notification creation failed:', notifErr.message);
        }

        // Immutable compliance audit log
        await recordAuditLog({
          actor: {
            name: `GitHub (@${mergedBy})`,
            email: 'github-webhook@teamsync.internal',
            role: 'System',
          },
          action: 'WEBHOOK_GITHUB_PR_MERGE',
          resourceType: 'Task',
          resourceId: String(matchedTask._id),
          details: {
            deliveryId,
            prNumber,
            prTitle,
            prUrl,
            headBranch,
            mergedBy,
            repository,
            previousStatus,
            newStatus: 'Done',
          },
          ipAddress,
          status: 'SUCCESS',
        });

        const summary = `Merged PR #${prNumber} ("${prTitle}") transitioned task "${matchedTask.title}" from ${previousStatus} to Done.`;

        // Record Delivery for Idempotency
        const delivery = await WebhookDelivery.create({
          deliveryId,
          event,
          action,
          sender: mergedBy,
          repository,
          status: 'PROCESSED',
          summary,
          matchedTaskId: matchedTask._id,
          signatureValid: true,
          ipAddress,
          payloadSnippet: {
            prNumber,
            prTitle,
            headBranch,
            prUrl,
            mergedBy,
          },
        });

        broadcastEvent('webhook:delivery', delivery);

        // Optional outbound Slack dispatch
        await dispatchOutboundSlackNotification(summary, { prNumber, prUrl, taskTitle: matchedTask.title });

        return {
          success: true,
          idempotent: false,
          transitioned: true,
          matchedTask: {
            _id: matchedTask._id,
            title: matchedTask.title,
            status: matchedTask.status,
            githubPrNumber: prNumber,
          },
          summary,
        };
      } else {
        // PR merged, but no matching task was mentioned
        const summary = `PR #${prNumber} merged by @${mergedBy}, but no matching active task was referenced.`;
        const delivery = await WebhookDelivery.create({
          deliveryId,
          event,
          action,
          sender: mergedBy,
          repository,
          status: 'IGNORED',
          summary,
          signatureValid: true,
          ipAddress,
          payloadSnippet: { prNumber, prTitle, headBranch, prUrl },
        });

        broadcastEvent('webhook:delivery', delivery);

        return {
          success: true,
          idempotent: false,
          transitioned: false,
          summary,
        };
      }
    } else {
      // Non-merge PR actions (e.g. opened, edited, synchronize, closed without merge)
      const summary = `PR #${prNumber} action "${action}" ignored (requires action="closed" and merged=true).`;
      const delivery = await WebhookDelivery.create({
        deliveryId,
        event,
        action,
        sender,
        repository,
        status: 'IGNORED',
        summary,
        signatureValid: true,
        ipAddress,
        payloadSnippet: { prNumber, action, merged: isMerged },
      });

      broadcastEvent('webhook:delivery', delivery);

      return {
        success: true,
        idempotent: false,
        transitioned: false,
        summary,
      };
    }
  }

  // --- 4. OTHER EVENTS (PUSH, ETC.) ---
  const summary = `Received and logged event "${event}". No automated actions configured.`;
  const delivery = await WebhookDelivery.create({
    deliveryId,
    event,
    sender,
    repository,
    status: 'IGNORED',
    summary,
    signatureValid: true,
    ipAddress,
    payloadSnippet: { event },
  });

  broadcastEvent('webhook:delivery', delivery);

  return {
    success: true,
    idempotent: false,
    summary,
  };
};

/**
 * Fetch paginated webhook delivery records
 */
export const fetchWebhookDeliveries = async ({ page = 1, limit = 50, status } = {}) => {
  const query = {};
  if (status && status !== 'ALL') {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [deliveries, total] = await Promise.all([
    WebhookDelivery.find(query)
      .populate('matchedTaskId', 'title type status assignee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    WebhookDelivery.countDocuments(query),
  ]);

  return {
    deliveries,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Fetch statistics on webhook processing and idempotency
 */
export const fetchWebhookStats = async () => {
  const [total, processed, duplicatePrevented, verificationFailed] = await Promise.all([
    WebhookDelivery.countDocuments(),
    WebhookDelivery.countDocuments({ status: 'PROCESSED' }),
    WebhookDelivery.countDocuments({ status: 'DUPLICATE' }),
    WebhookDelivery.countDocuments({ status: 'VERIFICATION_FAILED' }),
  ]);

  return {
    total,
    processed,
    duplicatePrevented,
    verificationFailed,
    secretConfigured: Boolean(GITHUB_WEBHOOK_SECRET),
  };
};

/**
 * Helper to dispatch a simulated GitHub PR merge payload with authentic HMAC-SHA256 signature
 */
export const simulateGitHubPRMerge = async ({
  taskId,
  prTitle,
  prNumber = 42,
  githubAuthor = 'octocat',
  deliveryId,
}) => {
  let task = null;
  if (taskId) {
    task = await Task.findById(taskId);
  }

  const generatedDeliveryId =
    deliveryId || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const title = prTitle || (task ? `fix: resolve ${task.title} (closes #${task._id})` : 'feat: core integration');

  const simulatedPayload = {
    action: 'closed',
    sender: { login: githubAuthor },
    repository: { full_name: 'teamsync-org/teamsync-collab-platform' },
    pull_request: {
      number: prNumber,
      title,
      body: task ? `Resolves deliverable #${task._id}\nAutomatic status transition test.` : 'Automated test.',
      html_url: `https://github.com/teamsync-org/teamsync-collab-platform/pull/${prNumber}`,
      merged: true,
      head: { ref: task ? `feature/${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'feature/sync' },
      merged_by: { login: githubAuthor },
    },
  };

  const rawJson = JSON.stringify(simulatedPayload);
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  hmac.update(rawJson);
  const calculatedSignature = `sha256=${hmac.digest('hex')}`;

  const result = await processGitHubWebhook({
    deliveryId: generatedDeliveryId,
    event: 'pull_request',
    payload: simulatedPayload,
    ipAddress: '127.0.0.1 (Simulator)',
  });

  return {
    deliveryId: generatedDeliveryId,
    signature: calculatedSignature,
    ...result,
  };
};
