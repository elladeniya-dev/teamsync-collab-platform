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
  const actorName = auditContext.actor?.name || 'Workspace Collaborator';
  const initialActivity = [
    {
      actor: {
        name: actorName,
        email: auditContext.actor?.email || '',
        avatar: auditContext.actor?.avatar || '',
      },
      action: 'CREATED_TASK',
      details: `Created deliverable with initial status "${taskData.status || 'In Progress'}"`,
      timestamp: new Date(),
    },
  ];

  const task = await Task.create({
    ...taskData,
    activity: initialActivity,
  });

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
  const existingTask = await Task.findById(id);
  if (!existingTask) {
    throw new ApiError(404, `Task not found with id: ${id}`);
  }

  const actorName = auditContext.actor?.name || 'Workspace Collaborator';
  const newActivityEntries = [];

  // Track status transitions
  if (updateData.status && updateData.status !== existingTask.status) {
    newActivityEntries.push({
      actor: {
        name: actorName,
        email: auditContext.actor?.email || '',
        avatar: auditContext.actor?.avatar || '',
      },
      action: 'STATUS_TRANSITION',
      details: `Transitioned status from "${existingTask.status}" to "${updateData.status}"`,
      timestamp: new Date(),
    });

    if (updateData.status === 'Done') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  // Track priority adjustments
  if (updateData.priority && updateData.priority !== existingTask.priority) {
    newActivityEntries.push({
      actor: {
        name: actorName,
        email: auditContext.actor?.email || '',
        avatar: auditContext.actor?.avatar || '',
      },
      action: 'PRIORITY_CHANGED',
      details: `Changed priority from "${existingTask.priority}" to "${updateData.priority}"`,
      timestamp: new Date(),
    });
  }

  // Track assignee changes
  if (updateData.assignee && updateData.assignee !== existingTask.assignee) {
    newActivityEntries.push({
      actor: {
        name: actorName,
        email: auditContext.actor?.email || '',
        avatar: auditContext.actor?.avatar || '',
      },
      action: 'REASSIGNED',
      details: `Reassigned from "${existingTask.assignee || 'Unassigned'}" to "${updateData.assignee}"`,
      timestamp: new Date(),
    });
  }

  if (newActivityEntries.length > 0) {
    if (!updateData.$push) updateData.$push = {};
    updateData.$push.activity = { $each: newActivityEntries };
  }

  const task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

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

/**
 * Add a new subtask checklist item
 */
export const addSubtaskService = async (taskId, title, auditContext = {}) => {
  if (!title || !title.trim()) {
    throw new ApiError(400, 'Subtask title is required');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${taskId}`);
  }

  const actorName = auditContext.actor?.name || 'Workspace Collaborator';
  const newSubtask = {
    title: title.trim(),
    completed: false,
    completedAt: null,
  };

  task.subtasks.push(newSubtask);
  task.activity.push({
    actor: {
      name: actorName,
      email: auditContext.actor?.email || '',
      avatar: auditContext.actor?.avatar || '',
    },
    action: 'SUBTASK_ADDED',
    details: `Added subtask item "${title.trim()}"`,
    timestamp: new Date(),
  });

  await task.save();
  broadcastEvent('task:updated', task);

  return task;
};

/**
 * Toggle subtask completion status
 */
export const toggleSubtaskService = async (taskId, subtaskId, completed, auditContext = {}) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${taskId}`);
  }

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) {
    throw new ApiError(404, `Subtask not found with id: ${subtaskId}`);
  }

  subtask.completed = Boolean(completed);
  subtask.completedAt = completed ? new Date() : null;

  const actorName = auditContext.actor?.name || 'Workspace Collaborator';
  task.activity.push({
    actor: {
      name: actorName,
      email: auditContext.actor?.email || '',
      avatar: auditContext.actor?.avatar || '',
    },
    action: 'SUBTASK_TOGGLED',
    details: `${completed ? 'Completed' : 'Reopened'} checklist item "${subtask.title}"`,
    timestamp: new Date(),
  });

  await task.save();
  broadcastEvent('task:updated', task);

  return task;
};

/**
 * Delete a subtask checklist item
 */
export const deleteSubtaskService = async (taskId, subtaskId, auditContext = {}) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${taskId}`);
  }

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) {
    throw new ApiError(404, `Subtask not found with id: ${subtaskId}`);
  }

  const subtaskTitle = subtask.title;
  task.subtasks.pull(subtaskId);

  const actorName = auditContext.actor?.name || 'Workspace Collaborator';
  task.activity.push({
    actor: {
      name: actorName,
      email: auditContext.actor?.email || '',
      avatar: auditContext.actor?.avatar || '',
    },
    action: 'SUBTASK_REMOVED',
    details: `Removed checklist item "${subtaskTitle}"`,
    timestamp: new Date(),
  });

  await task.save();
  broadcastEvent('task:updated', task);

  return task;
};

/**
 * Add a comment to task discussion thread
 */
export const addCommentService = async (taskId, text, auditContext = {}) => {
  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment text cannot be empty');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, `Task not found with id: ${taskId}`);
  }

  const actor = auditContext.actor || {};
  const newComment = {
    author: {
      id: actor._id || null,
      name: actor.name || 'Workspace Collaborator',
      email: actor.email || '',
      avatar: actor.avatar || '',
      role: actor.role || 'Member',
    },
    text: text.trim(),
    createdAt: new Date(),
  };

  task.comments.push(newComment);
  task.activity.push({
    actor: {
      name: actor.name || 'Workspace Collaborator',
      email: actor.email || '',
      avatar: actor.avatar || '',
    },
    action: 'COMMENT_POSTED',
    details: `Posted a comment on the deliverable`,
    timestamp: new Date(),
  });

  await task.save();
  broadcastEvent('task:updated', task);

  // Notify assignee if not the author
  try {
    if (task.assignee && task.assignee !== actor.name) {
      const notif = await Notification.create({
        title: 'New Comment on Deliverable',
        message: `${actor.name || 'A teammate'} commented on "${task.title}".`,
        type: 'task',
        priority: 'low',
        link: '/tasks',
        metadata: { taskId: task._id.toString() },
      });
      broadcastEvent('notification:new', notif);
    }
  } catch (notifErr) {
    console.warn('Could not dispatch comment notification:', notifErr.message);
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
