import TeamMember from '../models/TeamMember.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { recordAuditLog } from './auditService.js';

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

export const createMember = async (memberData, auditContext = {}) => {
  const member = await TeamMember.create(memberData);

  // Broadcast WebSocket update
  broadcastEvent('team:created', member);

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'MEMBER_CREATE',
      resourceType: 'TeamMember',
      resourceId: String(member._id),
      details: {
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'New Team Collaborator',
      message: `${member.name} (${member.role || 'Member'}) joined the workspace.`,
      type: 'team',
      priority: 'low',
      link: '/team',
      metadata: { memberId: member._id.toString() },
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for team member:', notifErr.message);
  }

  return member;
};

export const updateMember = async (id, updateData, auditContext = {}) => {
  const member = await TeamMember.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!member) {
    throw new ApiError(404, `Team member not found with id: ${id}`);
  }

  // Broadcast WebSocket update
  broadcastEvent('team:updated', member);

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'MEMBER_UPDATE',
      resourceType: 'TeamMember',
      resourceId: String(member._id),
      details: {
        name: member.name,
        updatedFields: Object.keys(updateData),
        status: member.status,
        role: member.role,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'Collaborator Profile Updated',
      message: `${member.name} is now ${member.status} as ${member.role}.`,
      type: 'team',
      priority: 'low',
      link: '/team',
      metadata: { memberId: member._id.toString() },
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for updated member:', notifErr.message);
  }

  return member;
};

export const deleteMember = async (id, auditContext = {}) => {
  const member = await TeamMember.findByIdAndDelete(id);
  if (!member) {
    throw new ApiError(404, `Team member not found with id: ${id}`);
  }

  // Broadcast WebSocket update
  broadcastEvent('team:deleted', { id });

  // Record immutable audit log
  if (auditContext.actor) {
    await recordAuditLog({
      actor: auditContext.actor,
      action: 'MEMBER_DELETE',
      resourceType: 'TeamMember',
      resourceId: String(id),
      details: {
        name: member.name,
        email: member.email,
        role: member.role,
      },
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      status: 'SUCCESS',
    });
  }

  try {
    const notif = await Notification.create({
      title: 'Team Directory Updated',
      message: `${member.name} was removed from the team directory.`,
      type: 'team',
      priority: 'low',
      link: '/team',
    });
    broadcastEvent('notification:new', notif);
  } catch (notifErr) {
    console.warn('Could not create notification for removed member:', notifErr.message);
  }

  return member;
};
