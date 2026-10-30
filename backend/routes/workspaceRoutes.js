import express from 'express';
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);
router.post('/', protect, requireRole(['Owner', 'Admin']), createWorkspace);
router.put('/:id', protect, requireRole(['Owner', 'Admin']), updateWorkspace);
router.patch('/:id', protect, requireRole(['Owner', 'Admin']), updateWorkspace);
router.delete('/:id', protect, requireRole(['Owner']), deleteWorkspace);

export default router;
