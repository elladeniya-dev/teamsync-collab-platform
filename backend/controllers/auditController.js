import { asyncHandler } from '../utils/asyncHandler.js';
import * as auditService from '../services/auditService.js';

/**
 * @desc Get paginated audit logs with optional filters
 * @route GET /api/audit-logs
 * @access Private (Owner, Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.fetchAuditLogs(req.query);
  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @desc Get audit log summary statistics
 * @route GET /api/audit-logs/stats
 * @access Private (Owner, Admin)
 */
export const getAuditStats = asyncHandler(async (req, res) => {
  const stats = await auditService.fetchAuditStats();
  res.status(200).json({
    success: true,
    stats,
  });
});
