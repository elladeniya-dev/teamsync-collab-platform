import * as teamService from '../services/teamService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMembers = asyncHandler(async (req, res) => {
  const members = await teamService.getAllMembers();
  res.status(200).json(members);
});

export const getMemberById = asyncHandler(async (req, res) => {
  const member = await teamService.getMemberById(req.params.id);
  res.status(200).json(member);
});

export const addMember = asyncHandler(async (req, res) => {
  const member = await teamService.createMember(req.body);
  res.status(201).json(member);
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = await teamService.updateMember(req.params.id, req.body);
  res.status(200).json(member);
});

export const removeMember = asyncHandler(async (req, res) => {
  await teamService.deleteMember(req.params.id);
  res.status(200).json({ success: true, message: 'Member removed successfully' });
});
