import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskById
} from '../controllers/taskController.js';

const router = express.Router();

// Read all tasks
router.get('/', getTasks);

// Read one task by ID
router.get('/:id', getTaskById);

// Create new task
router.post('/', createTask);

// Update task by ID
router.put('/:id', updateTask);

// Delete task by ID
router.delete('/:id', deleteTask);

export default router;
