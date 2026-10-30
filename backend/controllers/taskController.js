import * as taskService from '../services/taskService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks();
  res.status(200).json(tasks);
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json(task);
});

export const createTask = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const task = await taskService.createTask(req.body, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(201).json(task);
});

export const updateTask = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const task = await taskService.updateTask(req.params.id, req.body, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(200).json(task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  await taskService.deleteTask(req.params.id, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});
