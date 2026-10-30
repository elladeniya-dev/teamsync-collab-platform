import TeamMember from '../models/TeamMember.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { broadcastEvent } from '../socket/socketManager.js';
import { recordAuditLog } from './auditService.js';
import { normalizeRole } from '../middlewares/rbacMiddleware.js';

/**
 * Automatically reconciles registered User accounts into the TeamMember collection
 * so all authenticated workspace users appear in Team Directory and Task Assignee dropdowns.
 */
export const syncUsersWithTeamMembers = async (retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const users = await User.find();
      for (const u of users) {
        if (!u.email) continue;
        const normalizedEmail = u.email.toLowerCase().trim();
        const existing = await TeamMember.findOne({ email: normalizedEmail });

        if (!existing) {
          let teamRole = 'Fullstack Engineer';
          const lowerRole = (u.role || '').toLowerCase();
          if (lowerRole === 'owner' || lowerRole === 'admin') {
            teamRole = 'Project Lead';
          } else if (lowerRole === 'guest') {
            teamRole = 'QA Specialist';
          }

          const newMember = await TeamMember.create({
            name: u.name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            role: teamRole,
            accessRole: normalizeRole(u.role),
            status: 'Active',
            avatar: u.avatar || '',
          });

          broadcastEvent('team:created', newMember);
        } else {
          let updated = false;
          if (u.avatar && !existing.avatar) {
            existing.avatar = u.avatar;
            updated = true;
          }
          if (u.role && existing.accessRole !== normalizeRole(u.role)) {
            existing.accessRole = normalizeRole(u.role);
            updated = true;
          }
          if (updated) {
            await existing.save();
            broadcastEvent('team:updated', existing);
          }
        }
      }
      return; // Success
    } catch (err) {
      if (attempt === retries) {
        console.warn('Could not sync users with team directory (transient network):', err.message);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
};

export const getAllMembers = async () => {
  await syncUsersWithTeamMembers();
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
  const current = await TeamMember.findById(id);
  if (!current) {
    throw new ApiError(404, `Team member not found with id: ${id}`);
  }

  let isRoleChange = false;
  let previousAccessRole = current.accessRole;

  if (updateData.accessRole) {
    const newAccessRole = normalizeRole(updateData.accessRole);
    updateData.accessRole = newAccessRole;

    const actorRole = auditContext.actor ? normalizeRole(auditContext.actor.role) : 'Owner';
    if (actorRole !== 'Owner' && actorRole !== 'Admin') {
      throw new ApiError(403, 'Only Workspace Owners and Admins can modify member access roles');
    }

    if (newAccessRole === 'Owner' && actorRole !== 'Owner') {
      throw new ApiError(403, 'Only the Workspace Owner can appoint or transfer Owner permissions');
    }

    if (current.accessRole === 'Owner' && actorRole !== 'Owner') {
      throw new ApiError(403, 'Only the Workspace Owner can modify an Owner account');
    }

    if (newAccessRole !== current.accessRole) {
      isRoleChange = true;
      // Synchronize with User account if registered
      if (current.email) {
        await User.findOneAndUpdate(
          { email: current.email.toLowerCase().trim() },
          { role: newAccessRole }
        );
      }
    }
  }

  const member = await TeamMember.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Broadcast WebSocket update
  broadcastEvent('team:updated', member);

  // Record immutable audit log
  if (auditContext.actor) {
    if (isRoleChange) {
      await recordAuditLog({
        actor: auditContext.actor,
        action: 'ROLE_CHANGE',
        resourceType: 'User',
        resourceId: String(member._id),
        details: {
          targetUserName: member.name,
          targetUserEmail: member.email,
          previousRole: previousAccessRole,
          newRole: member.accessRole,
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        status: 'SUCCESS',
      });
    } else {
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
  }

  try {
    const notif = await Notification.create({
      title: isRoleChange ? 'Access Role Updated' : 'Collaborator Profile Updated',
      message: isRoleChange
        ? `${member.name}'s access role was updated to ${member.accessRole}.`
        : `${member.name} is now ${member.status} as ${member.role}.`,
      type: 'team',
      priority: isRoleChange ? 'medium' : 'low',
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
