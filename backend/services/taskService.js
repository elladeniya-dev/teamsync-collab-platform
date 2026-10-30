import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { recordAuditLog } from './auditService.js';

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

export const createTask = async (taskData, auditContext = {}) => {
  const task = await Task.create(taskData);

  // Broadcast real-time WebSocket event
  broadcastEvent('task:created', task);

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'TASK_CREATE',
      resourceType: 'Task',
      resourceId: String(task._id),
      details: {
        title: task.title,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        deadline: task.deadline,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'New Task Created',
      message: `"${task.title}" assigned to ${task.assignee || 'team'}.`,
      type: 'task',
      priority: task.type === 'Deadline' ? 'high' : 'medium',
      link: '/tasks',
      metadata: { taskId: task._id.toString() },
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for new task:', notifErr.message);
  }

  return task;
};

export const updateTask = async (id, updateData, auditContext = {}) => {
  const task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }

  // Broadcast real-time WebSocket event
  broadcastEvent('task:updated', task);

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'TASK_UPDATE',
      resourceType: 'Task',
      resourceId: String(task._id),
      details: {
        title: task.title,
        updatedFields: Object.keys(updateData),
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'Task Deliverable Updated',
      message: `"${task.title}" details were modified.`,
      type: 'task',
      priority: 'low',
      link: '/tasks',
      metadata: { taskId: task._id.toString() },
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for updated task:', notifErr.message);
  }

  return task;
};

export const deleteTask = async (id, auditContext = {}) => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }

  // Broadcast real-time WebSocket event
  broadcastEvent('task:deleted', { id });

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'TASK_DELETE',
      resourceType: 'Task',
      resourceId: String(id),
      details: {
        title: task.title,
        assignee: task.assignee,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'Task Deliverable Removed',
      message: `"${task.title}" was removed from the sprint board.`,
      type: 'task',
      priority: 'medium',
      link: '/tasks',
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for deleted task:', notifErr.message);
  }

  return task;
};
