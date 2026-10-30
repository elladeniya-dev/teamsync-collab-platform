import { ApiError } from '../utils/ApiError.js';
import { recordAuditLog } from '../services/auditService.js';

export const ROLE_HIERARCHY = {
  Owner: 40,
  Admin: 30,
  Member: 20,
  Guest: 10,
};

/**
 * Normalizes role string to standard PascalCase
 */
export const normalizeRole = (role) => {
  if (!role) return 'Member';
  const lower = String(role).toLowerCase();
  if (lower === 'owner') return 'Owner';
  if (lower === 'admin') return 'Admin';
  if (lower === 'guest') return 'Guest';
  return 'Member';
};

/**
 * Express Middleware to enforce Granular Role-Based Access Control
 * @param {string|string[]} roles - Minimum role required (e.g. 'Admin') or array of allowed roles (e.g. ['Owner', 'Admin'])
 */
export const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions'));
    }

    const userRole = normalizeRole(req.user.role);
    const userWeight = ROLE_HIERARCHY[userRole] || 10;

    let isAuthorized = false;

    if (Array.isArray(roles)) {
      const normalizedAllowed = roles.map(normalizeRole);
      isAuthorized = normalizedAllowed.includes(userRole);
    } else if (typeof roles === 'string') {
      const minWeight = ROLE_HIERARCHY[normalizeRole(roles)] || 10;
      isAuthorized = userWeight >= minWeight;
    }

    if (isAuthorized) {
      return next();
    }

    // Access Denied: Record immutable security audit log
    const ipAddress =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';

    await recordAuditLog({
      actor: req.user,
      action: 'SECURITY_UNAUTHORIZED_ACCESS',
      resourceType: 'Security',
      resourceId: req.params.id || '',
      details: {
        path: req.originalUrl,
        method: req.method,
        userRole,
        requiredRoles: roles,
      },
      ipAddress,
      userAgent,
      status: 'DENIED',
    });

    return next(
      new ApiError(
        403,
        `Access denied: Your current role (${userRole}) does not have permission to perform this action.`
      )
    );
  };
};
