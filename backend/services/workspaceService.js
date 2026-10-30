import Workspace from '../models/Workspace.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { recordAuditLog } from './auditService.js';

export const getAllWorkspaces = async () => {
  let workspaces = await Workspace.find().sort({ createdAt: 1 });

  // Auto-seed standard workspaces if none exist yet
  if (workspaces.length === 0) {
    await Workspace.create([
      {
        name: 'Main Workspace',
        currentSprint: 'Sprint 1',
        sprints: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog'],
        description: 'Core product development & delivery pipeline',
        isDefault: true,
      },
      {
        name: 'Mobile App Launch',
        currentSprint: 'Sprint 3',
        sprints: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Beta Release'],
        description: 'Cross-platform mobile application sprint track',
        isDefault: false,
      },
      {
        name: 'Core Platform API',
        currentSprint: 'Sprint 2',
        sprints: ['Sprint 1', 'Sprint 2', 'Security Audit'],
        description: 'Backend microservices, authentication & infrastructure',
        isDefault: false,
      },
    ]);

    workspaces = await Workspace.find().sort({ createdAt: 1 });
  }

  return workspaces;
};

export const getWorkspaceById = async (id) => {
  const workspace = await Workspace.findById(id);
  if (!workspace) {
    throw new ApiError(404, `Workspace not found with id: ${id}`);
  }
  return workspace;
};

export const createWorkspace = async (workspaceData, auditContext = {}) => {
  const sprints =
    workspaceData.sprints && workspaceData.sprints.length > 0
      ? workspaceData.sprints
      : [workspaceData.currentSprint || 'Sprint 1', 'Sprint 2', 'Backlog'];

  const workspace = await Workspace.create({
    ...workspaceData,
    sprints,
  });

  // Broadcast WebSocket update
  broadcastEvent('workspace:created', workspace);

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'WORKSPACE_CREATE',
      resourceType: 'Workspace',
      resourceId: String(workspace._id),
      details: {
        name: workspace.name,
        currentSprint: workspace.currentSprint,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'New Workspace Initialized',
      message: `"${workspace.name}" created on ${workspace.currentSprint}.`,
      type: 'system',
      priority: 'low',
      link: '/tasks',
    });
    broadcastEvent('notification:new', notif);
  } catch (err) {
    console.warn('Could not record notification for workspace creation:', err.message);
  }

  return workspace;
};

export const updateWorkspace = async (id, updateData, auditContext = {}) => {
  const current = await Workspace.findById(id);
  if (!current) {
    throw new ApiError(404, `Workspace not found with id: ${id}`);
  }

  // If a new sprint is introduced, append it to the sprints array
  if (updateData.currentSprint && !current.sprints.includes(updateData.currentSprint)) {
    updateData.sprints = [...current.sprints, updateData.currentSprint];
  }

  const workspace = await Workspace.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Broadcast WebSocket update
  broadcastEvent('workspace:updated', workspace);

  // Record immutable audit log
  if (auditContext.actor) {
    const isSprintChange =
      updateData.currentSprint && updateData.currentSprint !== current.currentSprint;
    await recordAuditLog({
      actor: auditContext.actor,
      action: isSprintChange ? 'SPRINT_UPDATE' : 'WORKSPACE_UPDATE',
      resourceType: 'Workspace',
      resourceId: String(workspace._id),
      details: {
        name: workspace.name,
        previousSprint: current.currentSprint,
        currentSprint: workspace.currentSprint,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  if (updateData.currentSprint && updateData.currentSprint !== current.currentSprint) {
    try {
      const notif = await Notification.create({
        title: 'Active Sprint Changed',
        message: `Workspace "${workspace.name}" transitioned to ${workspace.currentSprint}.`,
        type: 'task',
        priority: 'medium',
        link: '/tasks',
      });
      broadcastEvent('notification:new', notif);
    } catch (err) {
      console.warn('Could not record notification for sprint change:', err.message);
    }
  }

  return workspace;
};

export const deleteWorkspace = async (id, auditContext = {}) => {
  const workspace = await Workspace.findByIdAndDelete(id);
  if (!workspace) {
    throw new ApiError(404, `Workspace not found with id: ${id}`);
  }

  broadcastEvent('workspace:deleted', { id });

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'WORKSPACE_DELETE',
      resourceType: 'Workspace',
      resourceId: String(id),
      details: {
        name: workspace.name,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  return workspace;
};
