import express from 'express';
import {
  getMembers,
  addMember,
  updateMember,
  removeMember,
} from '../controllers/teamMemberController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/', getMembers);
router.post('/', protect, requireRole(['Owner', 'Admin']), addMember);
router.put('/:id', protect, requireRole(['Owner', 'Admin', 'Member']), updateMember);
router.patch('/:id', protect, requireRole(['Owner', 'Admin', 'Member']), updateMember);
router.delete('/:id', protect, requireRole(['Owner', 'Admin']), removeMember);

export default router;
