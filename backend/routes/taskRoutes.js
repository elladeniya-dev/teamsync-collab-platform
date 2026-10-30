import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
} from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

// Read tasks (accessible to all authenticated or public)
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Create task: Owner, Admin, Member (Guest denied)
router.post('/', protect, requireRole(['Owner', 'Admin', 'Member']), createTask);

// Update task: Owner, Admin, Member (Guest denied)
router.put('/:id', protect, requireRole(['Owner', 'Admin', 'Member']), updateTask);

// Delete task: Owner, Admin only (Member and Guest denied)
router.delete('/:id', protect, requireRole(['Owner', 'Admin']), deleteTask);

export default router;
