import AuditLog from '../models/AuditLog.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { normalizeRole } from '../middlewares/rbacMiddleware.js';

/**
 * Record an immutable audit log entry
 */
export const recordAuditLog = async ({
  actor = {},
  action,
  resourceType,
  resourceId = '',
  details = {},
  ipAddress = '127.0.0.1',
  userAgent = 'Unknown Client',
  status = 'SUCCESS',
}) => {
  try {
    const logEntry = await AuditLog.create({
      actor: {
        id: actor._id || actor.id,
        name: actor.name || 'System User',
        email: actor.email || 'system@teamsync.internal',
        role: normalizeRole(actor.role),
      },
      action,
      resourceType,
      resourceId: String(resourceId || ''),
      details,
      ipAddress,
      userAgent,
      status,
      createdAt: new Date(),
    });

    // Real-time broadcast to connected clients (live audit dashboard)
    try {
      broadcastEvent('audit:created', logEntry);
    } catch (wsErr) {
      console.warn('[AuditService] WebSocket broadcast error:', wsErr.message);
    }

    return logEntry;
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error.message);
    return null;
  }
};

/**
 * Fetch paginated audit logs with search and filtering
 */
export const fetchAuditLogs = async ({
  page = 1,
  limit = 50,
  action,
  resourceType,
  status,
  search,
} = {}) => {
  const query = {};

  if (action && action !== 'ALL') {
    query.action = action;
  }

  if (resourceType && resourceType !== 'ALL') {
    query.resourceType = resourceType;
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { 'actor.name': searchRegex },
      { 'actor.email': searchRegex },
      { action: searchRegex },
      { resourceType: searchRegex },
      { ipAddress: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get audit log summary statistics
 */
export const fetchAuditStats = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalLogs, last24hLogs, deniedAttempts, uniqueActors] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    AuditLog.countDocuments({ status: 'DENIED' }),
    AuditLog.distinct('actor.email'),
  ]);

  return {
    totalLogs,
    last24hLogs,
    deniedAttempts,
    activeActors: uniqueActors.length,
  };
};
