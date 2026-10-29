import Task from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';

export const getAllTasks = async () => {
  return await Task.find().sort({ deadline: 1 });
};

export const getTaskById = async (id) => {
  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }
  return task;
};

export const createTask = async (taskData) => {
  return await Task.create(taskData);
};

export const updateTask = async (id, updateData) => {
  const task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }
  return task;
};

export const deleteTask = async (id) => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }
  return task;
};
