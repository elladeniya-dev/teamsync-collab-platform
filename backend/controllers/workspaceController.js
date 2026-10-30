import * as workspaceService from '../services/workspaceService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getAllWorkspaces();
  res.status(200).json(workspaces);
});

export const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceById(req.params.id);
  res.status(200).json(workspace);
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const workspace = await workspaceService.createWorkspace(req.body, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(201).json(workspace);
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.body, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(200).json(workspace);
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  await workspaceService.deleteWorkspace(req.params.id, {
    actor: req.user,
    ipAddress,
    userAgent,
  });
  res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
});
