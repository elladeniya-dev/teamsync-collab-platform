import Task from '../models/Task.js';

// GET all tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET a single task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// POST create a new task
export const createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create task' });
  }
};

// PUT update a task by ID
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update task' });
  }
};

// DELETE a task by ID
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
