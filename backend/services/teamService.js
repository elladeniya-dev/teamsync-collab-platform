import TeamMember from '../models/TeamMember.js';
import { ApiError } from '../utils/ApiError.js';

export const getAllMembers = async () => {
  return await TeamMember.find().sort({ createdAt: -1 });
};

export const getMemberById = async (id) => {
  const member = await TeamMember.findById(id);
  if (!member) {
    throw new ApiError(404, `Team member not found with id: ${id}`);
  }
  return member;
};

export const createMember = async (memberData) => {
  return await TeamMember.create(memberData);
};

export const deleteMember = async (id) => {
  const member = await TeamMember.findByIdAndDelete(id);
  if (!member) {
    throw new ApiError(404, `Team member not found with id: ${id}`);
  }
  return member;
};
