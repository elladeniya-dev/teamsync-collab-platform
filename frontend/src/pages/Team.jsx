import React, { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { teamApi, taskApi } from '../api/client';
import { 
  TeamIcon, 
  PlusIcon, 
  TrashIcon, 
  SearchIcon, 
  CheckCircleIcon,
  EditIcon,
  LockIcon,
  ShieldIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  Modal
} from '../components';
import { useAuth } from '../context/AuthContext';

export const TEAM_ROLES = [
  'Project Lead',
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Engineer',
  'UI/UX Designer',
  'DevOps Engineer',
  'QA Specialist',
  'Product Manager',
];

export const ACCESS_ROLES = [
  'Owner',
  'Admin',
  'Member',
  'Guest',
];

export const TEAM_STATUSES = [
  'Active',
  'In a Meeting',
  'Away',
  'Offline',
];

export const getStatusStyle = (status) => {
  switch (status) {
    case 'In a Meeting':
      return {
        pill: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'Away':
      return {
        pill: 'bg-blue-50 text-blue-700 border-blue-200/80',
        dot: 'bg-blue-500',
      };
    case 'Offline':
      return {
        pill: 'bg-slate-100 text-slate-600 border-slate-200/80',
        dot: 'bg-slate-400',
      };
    case 'Active':
    default:
      return {
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
      };
  }
};

export const getAccessRoleBadgeStyle = (role) => {
  const normalized = (role || 'Member').toLowerCase();
  switch (normalized) {
    case 'owner':
      return 'bg-purple-50 text-purple-700 border-purple-200/90 font-bold';
    case 'admin':
      return 'bg-blue-50 text-blue-700 border-blue-200/90 font-bold';
    case 'guest':
      return 'bg-slate-100 text-slate-500 border-slate-200 font-medium';
    case 'member':
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/90 font-semibold';
  }
};

const PERMISSIONS_MATRIX = [
  {
    category: 'Tasks & Deliverables',
    capabilities: [
      { name: 'Create Deliverables', owner: true, admin: true, member: true, guest: false },
      { name: 'Update Status & Checklists', owner: true, admin: true, member: true, guest: false },
      { name: 'Post Discussion Comments', owner: true, admin: true, member: true, guest: false },
      { name: 'Permanently Delete Tasks', owner: true, admin: true, member: false, guest: false },
    ],
  },
  {
    category: 'Sprints & Workspaces',
    capabilities: [
      { name: 'Create New Workspaces', owner: true, admin: true, member: false, guest: false },
      { name: 'Advance Sprint Cycles', owner: true, admin: true, member: true, guest: false },
      { name: 'Remove / Delete Sprint Cycles', owner: true, admin: true, member: true, guest: false },
      { name: 'Permanently Delete Workspace', owner: true, admin: false, member: false, guest: false },
    ],
  },
  {
    category: 'Team & Security Governance',
    capabilities: [
      { name: 'Invite New Collaborators', owner: true, admin: true, member: false, guest: false },
      { name: 'Assign Admin & Manage Roles', owner: true, admin: true, member: false, guest: false },
      { name: 'Remove Collaborators', owner: true, admin: true, member: false, guest: false },
      { name: 'Transfer Organization Ownership', owner: true, admin: false, member: false, guest: false },
    ],
  },
  {
    category: 'DevOps & Audit Compliance',
    capabilities: [
      { name: 'View Immutable Audit Logs (RBAC)', owner: true, admin: true, member: false, guest: false },
      { name: 'Configure GitHub PR Webhooks', owner: true, admin: true, member: false, guest: false },
      { name: 'Dispatch Webhook Simulations', owner: true, admin: true, member: true, guest: false },
    ],
  },
];

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Fullstack Engineer',
    accessRole: 'Member',
    status: 'Active',
  });
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isCurrentUserOwner = user?.role?.toLowerCase() === 'owner';
  const isCurrentUserAdmin = user?.role?.toLowerCase() === 'admin';
  const canManageMembers = isCurrentUserOwner || isCurrentUserAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [memberRes, taskRes] = await Promise.all([
        teamApi.getAll(),
        taskApi.getAll()
      ]);
      setMembers(memberRes.data || []);
      setTasks(taskRes.data || []);
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e?.preventDefault();
    const name = newMember.name.trim();
    const email = newMember.email.trim();

    if (!name) {
      return Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter collaborator full name.',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Email',
        text: 'Please enter a valid work email address.',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }

    try {
      const res = await teamApi.create({
        name,
        email,
        role: newMember.role,
        accessRole: newMember.accessRole,
        status: newMember.status,
      });
      setMembers((prev) => [...prev, res.data]);
      setNewMember({
        name: '',
        email: '',
        role: 'Fullstack Engineer',
        accessRole: 'Member',
        status: 'Active',
      });
      setIsAdding(false);

      Swal.fire({
        icon: 'success',
        title: 'Collaborator Added',
        text: `${name} has joined the team as ${newMember.role} (${newMember.accessRole}).`,
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
    } catch (err) {
      console.error('Add failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || 'Failed to add team member.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  };

  const handleStatusChange = async (memberId, memberName, newStatus) => {
    try {
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, status: newStatus } : m))
      );
      await teamApi.update(memberId, { status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
      fetchData();
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: 'Failed to update member status.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  };

  const handleRoleChange = async (memberId, memberName, newRole) => {
    try {
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, role: newRole } : m))
      );
      await teamApi.update(memberId, { role: newRole });
    } catch (err) {
      console.error('Role update failed:', err);
      fetchData();
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: 'Failed to update member title.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  };

  const handleAccessRoleChange = async (member, newAccessRole) => {
    if (member.accessRole === newAccessRole) return;

    if (newAccessRole === 'Owner' && !isCurrentUserOwner) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'Only the current Workspace Owner can transfer organization ownership.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (member.accessRole === 'Owner' && !isCurrentUserOwner) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'Only the Workspace Owner can modify Owner access permissions.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const actionDescription =
      newAccessRole === 'Admin'
        ? `promote ${member.name} to Administrator? They will be granted full authority to manage teammates, delete deliverables, and configure webhooks.`
        : newAccessRole === 'Owner'
        ? `transfer Workspace Ownership to ${member.name}? This will grant them primary administrative control over this workspace.`
        : newAccessRole === 'Guest'
        ? `demote ${member.name} to Guest? They will be restricted to read-only access across all project boards.`
        : `set ${member.name}'s access role to ${newAccessRole}?`;

    const confirm = await Swal.fire({
      title: `Assign ${newAccessRole} Permissions?`,
      text: `Are you sure you want to ${actionDescription}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newAccessRole === 'Admin' || newAccessRole === 'Owner' ? '#4f46e5' : '#475569',
      cancelButtonColor: '#334155',
      confirmButtonText: `Yes, assign ${newAccessRole}`,
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (confirm.isConfirmed) {
      try {
        await teamApi.update(member._id, { accessRole: newAccessRole });
        setMembers((prev) =>
          prev.map((m) => (m._id === member._id ? { ...m, accessRole: newAccessRole } : m))
        );

        // If the current user's role was changed, synchronize local session storage
        if (user?.email && member.email?.toLowerCase() === user.email.toLowerCase()) {
          const savedUser = localStorage.getItem('teamsync_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            parsed.role = newAccessRole;
            localStorage.setItem('teamsync_user', JSON.stringify(parsed));
          }
        }

        Swal.fire({
          icon: 'success',
          title: 'Access Role Updated',
          text: `${member.name} is now assigned as ${newAccessRole}.`,
          timer: 1800,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
      } catch (err) {
        console.error('Access role change failed:', err);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err?.response?.data?.message || 'Failed to modify access role.',
          background: '#0f172a',
          color: '#f8fafc',
        });
      }
    }
  };

  const handleRemove = async (id, name) => {
    const confirm = await Swal.fire({
      title: `Remove ${name}?`,
      text: 'This collaborator will no longer have access to the workspace or task assignments.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove',
      background: '#0f172a',
      color: '#f8fafc',
    });

    if (confirm.isConfirmed) {
      try {
        await teamApi.delete(id);
        setMembers((prev) => prev.filter((m) => m._id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Collaborator Removed',
          text: `${name} was removed from the team directory.`,
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
      } catch (err) {
        console.error('Remove failed:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: err?.response?.data?.message || 'Failed to remove member.',
          background: '#0f172a',
          color: '#f8fafc',
        });
      }
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.role && m.role.toLowerCase().includes(search.toLowerCase())) ||
      (m.accessRole && m.accessRole.toLowerCase().includes(search.toLowerCase()));

    const matchRole =
      selectedRoleFilter === 'All' || m.role === selectedRoleFilter;

    return matchSearch && matchRole;
  });

  const getMemberTaskCount = (memberName) => {
    return tasks.filter((t) => t.assignee?.toLowerCase() === memberName?.toLowerCase()).length;
  };

  const getAvatarGradient = (idx) => {
    const gradients = [
      'from-indigo-600 to-violet-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600',
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full pb-10">
      {/* Top Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Team Directory</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              {members.length} {members.length === 1 ? 'Collaborator' : 'Collaborators'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage workspace roles, granular access privileges (RBAC), and team workload
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Security & Access Permissions Matrix Button */}
          <button
            type="button"
            onClick={() => setIsPermissionsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition cursor-pointer"
            title="View role permissions and access control matrix"
          >
            <ShieldIcon className="w-4 h-4 text-indigo-600" />
            <span>Access & Permissions</span>
          </button>

          {/* Invite Member CTA */}
          <button
            type="button"
            onClick={() => {
              if (!canManageMembers) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Permission Denied',
                  text: 'Only Workspace Owners and Administrators can invite new collaborators.',
                  confirmButtonColor: '#4f46e5',
                  background: '#0f172a',
                  color: '#f8fafc',
                });
                return;
              }
              setIsAdding(!isAdding);
            }}
            className={`flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition ${
              canManageMembers
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
            }`}
            title={canManageMembers ? 'Invite Member' : 'Admin or Owner privileges required'}
          >
            {canManageMembers ? <PlusIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
            <span>{canManageMembers ? (isAdding ? 'Close Form' : 'Invite Member') : 'Invite (Admin Only)'}</span>
          </button>
        </div>
      </div>

      {/* Add New Member Form Panel */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/5 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Add New Collaborator
              </h3>
              <p className="text-xs text-slate-500">Configure identity, functional title, and access privileges.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Connor"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Work Email *
              </label>
              <input
                type="email"
                placeholder="e.g. sarah@company.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Job Title *
              </label>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              >
                {TEAM_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Access Level (RBAC) *
              </label>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={newMember.accessRole}
                onChange={(e) => setNewMember({ ...newMember, accessRole: e.target.value })}
              >
                <option value="Member">Member (Tasks & Comments)</option>
                <option value="Admin">Admin (Workspace Management)</option>
                <option value="Guest">Guest (Read-Only)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              Confirm & Add Collaborator
            </button>
          </div>
        </form>
      )}

      {/* Search and Role Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, role, or access level..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Role:</span>
          {['All', 'Lead', 'Developer', 'Designer'].map((filterRole) => (
            <button
              key={filterRole}
              onClick={() => setSelectedRoleFilter(filterRole === 'Lead' ? 'Project Lead' : filterRole === 'Developer' ? 'Fullstack Engineer' : filterRole === 'Designer' ? 'UI/UX Designer' : 'All')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                (selectedRoleFilter === 'All' && filterRole === 'All') ||
                (selectedRoleFilter === 'Project Lead' && filterRole === 'Lead') ||
                (selectedRoleFilter === 'Fullstack Engineer' && filterRole === 'Developer') ||
                (selectedRoleFilter === 'UI/UX Designer' && filterRole === 'Designer')
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterRole}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-medium">
          Loading team directory...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <TeamIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No collaborators found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'No collaborators matched your filter criteria.' : 'Invite your first collaborator above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member, idx) => {
            const taskCount = getMemberTaskCount(member.name);
            const statusConfig = getStatusStyle(member.status || 'Active');
            const isCurrentUser = Boolean(user?.email && member.email?.toLowerCase() === user.email.toLowerCase());
            const isTargetOwner = (member.accessRole || '').toLowerCase() === 'owner';

            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Avatar, Names, You Badge & Remove */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                          idx
                        )} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate" title={member.name}>
                            {member.name}
                          </h4>
                          {isCurrentUser && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate" title={member.role || 'Fullstack Engineer'}>
                          {member.role || 'Fullstack Engineer'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate" title={member.email}>
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Remove Action */}
                    {canManageMembers && !isTargetOwner ? (
                      <button
                        onClick={() => handleRemove(member._id, member.name)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                        title="Remove member"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-300 shrink-0"
                        title={isTargetOwner ? 'Owner account is protected' : 'Admin privileges required'}
                      >
                        <LockIcon className="w-3.5 h-3.5 text-slate-300" />
                      </span>
                    )}
                  </div>

                  {/* Access Level (RBAC) Row & Selector */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Access Role:
                    </span>

                    {/* Interactive Role Assignment for Owners & Admins */}
                    {canManageMembers && (!isTargetOwner || isCurrentUserOwner) ? (
                      <div className="relative">
                        <select
                          value={member.accessRole || 'Member'}
                          onChange={(e) => handleAccessRoleChange(member, e.target.value)}
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${getAccessRoleBadgeStyle(
                            member.accessRole
                          )}`}
                          title="Click to modify access role (RBAC)"
                        >
                          <option value="Admin">Admin (Full Access)</option>
                          <option value="Member">Member (Tasks & Comments)</option>
                          <option value="Guest">Guest (Read-Only)</option>
                          {isCurrentUserOwner && (
                            <option value="Owner">Owner (Transfer Ownership)</option>
                          )}
                        </select>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getAccessRoleBadgeStyle(
                        member.accessRole
                      )}`}>
                        <ShieldIcon className="w-3 h-3" />
                        <span>{member.accessRole || 'Member'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Dynamic Availability Status Selector + Workload Count */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  {/* Interactive Status Selector */}
                  <div className="relative group shrink-0">
                    <select
                      value={member.status || 'Active'}
                      onChange={(e) => handleStatusChange(member._id, member.name, e.target.value)}
                      className={`appearance-none pl-5 pr-3.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${statusConfig.pill}`}
                      title="Click to update availability status"
                    >
                      {TEAM_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-800">
                          {st}
                        </option>
                      ))}
                    </select>
                    {/* Live Presence Dot Indicator */}
                    <span className={`w-2 h-2 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusConfig.dot}`}></span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium truncate text-right">
                    <strong className="text-slate-900 font-semibold">{taskCount}</strong> assigned {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enterprise RBAC Access & Permissions Matrix Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title="Workspace Security & Access Permissions Matrix"
      >
        <div className="space-y-4 text-slate-800">
          <p className="text-xs text-slate-500 leading-relaxed">
            TeamSync enforces role-based access control (RBAC) following the Principle of Least Privilege. Below is the operational capability breakdown across security tiers.
          </p>

          {/* Quick Role Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/40">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Owner</span>
              <span className="text-xs font-semibold text-slate-800">Supreme Control</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Workspace creation, ownership transfers, and compliance</p>
            </div>
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Admin</span>
              <span className="text-xs font-semibold text-slate-800">Management</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Member roles, webhooks, sprint deletion, task deletion</p>
            </div>
            <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Member</span>
              <span className="text-xs font-semibold text-slate-800">Contributor</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Create & update tasks, subtasks, discussions, sprint advance</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Guest</span>
              <span className="text-xs font-semibold text-slate-800">Observer</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Read-only view access across all deliverables</p>
            </div>
          </div>

          {/* Granular Permission Comparison Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold text-slate-700">Capability / Governance Action</th>
                  <th className="py-2.5 px-2 font-bold text-purple-700 text-center">Owner</th>
                  <th className="py-2.5 px-2 font-bold text-blue-700 text-center">Admin</th>
                  <th className="py-2.5 px-2 font-bold text-indigo-700 text-center">Member</th>
                  <th className="py-2.5 px-2 font-bold text-slate-500 text-center">Guest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSIONS_MATRIX.map((section) => (
                  <React.Fragment key={section.category}>
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="py-1.5 px-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">
                        {section.category}
                      </td>
                    </tr>
                    {section.capabilities.map((cap) => (
                      <tr key={cap.name} className="hover:bg-slate-50/50 transition">
                        <td className="py-2 px-3 text-slate-700 font-medium">{cap.name}</td>
                        <td className="py-2 px-2 text-center">
                          {cap.owner ? <CheckIcon className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {cap.admin ? <CheckIcon className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {cap.member ? <CheckIcon className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {cap.guest ? <CheckIcon className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active Workspace Distribution */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Active Collaborator Distribution:</span>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-purple-700">{members.filter(m => (m.accessRole || '').toLowerCase() === 'owner').length} Owner</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-700">{members.filter(m => (m.accessRole || '').toLowerCase() === 'admin').length} Admins</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-700">{members.filter(m => (m.accessRole || 'member').toLowerCase() === 'member').length} Members</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{members.filter(m => (m.accessRole || '').toLowerCase() === 'guest').length} Guests</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsPermissionsModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Close Matrix
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Team;
