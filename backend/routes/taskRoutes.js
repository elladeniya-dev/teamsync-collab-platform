import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addComment,
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

// Subtask management: Owner, Admin, Member (Guest denied)
router.post('/:id/subtasks', protect, requireRole(['Owner', 'Admin', 'Member']), addSubtask);
router.patch('/:id/subtasks/:subtaskId', protect, requireRole(['Owner', 'Admin', 'Member']), toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', protect, requireRole(['Owner', 'Admin', 'Member']), deleteSubtask);

// Comment management: Owner, Admin, Member (Guest denied)
router.post('/:id/comments', protect, requireRole(['Owner', 'Admin', 'Member']), addComment);

export default router;
