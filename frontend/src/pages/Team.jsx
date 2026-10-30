import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { teamApi, taskApi } from '../api/client';
import { 
  TeamIcon, 
  PlusIcon, 
  TrashIcon, 
  SearchIcon,
  CheckCircleIcon,
  EditIcon,
  LockIcon
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

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Fullstack Engineer',
    status: 'Active',
  });
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManageMembers =
    user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin';

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
        confirmButtonColor: '#4f46e5'
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Email',
        text: 'Please enter a valid work email address.',
        confirmButtonColor: '#4f46e5'
      });
    }

    try {
      const res = await teamApi.create({
        name,
        email,
        role: newMember.role,
        status: newMember.status,
      });
      setMembers((prev) => [...prev, res.data]);
      setNewMember({
        name: '',
        email: '',
        role: 'Fullstack Engineer',
        status: 'Active',
      });
      setIsAdding(false);

      Swal.fire({
        icon: 'success',
        title: 'Collaborator Added!',
        text: `${name} has joined the team as ${newMember.role}.`,
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Add failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add team member.'
      });
    }
  };

  const handleStatusChange = async (memberId, memberName, newStatus) => {
    try {
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, status: newStatus } : m))
      );
      await teamApi.update(memberId, { status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
      fetchData();
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update member status.' });
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
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update member role.' });
    }
  };

  const handleRemove = async (id, name) => {
    const confirm = await Swal.fire({
      title: `Remove ${name}?`,
      text: 'This user will no longer be available as a task assignee.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove'
    });

    if (confirm.isConfirmed) {
      try {
        await teamApi.delete(id);
        setMembers((prev) => prev.filter((m) => m._id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: `${name} has been removed from the team.`,
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Remove failed:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove member.' });
      }
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.role && m.role.toLowerCase().includes(search.toLowerCase()));

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
    <div className="max-w-7xl mx-auto space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Team Directory</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage team roles, real-time availability status, and workload</p>
        </div>

        <button
          onClick={() => {
            if (!canManageMembers) {
              Swal.fire({
                icon: 'warning',
                title: 'Permission Denied',
                text: 'Only Workspace Owners and Administrators can invite new team members.',
                confirmButtonColor: '#4f46e5',
              });
              return;
            }
            setIsAdding(!isAdding);
          }}
          className={`flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition shrink-0 ${
            canManageMembers
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-lg cursor-pointer'
              : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
          }`}
          title={canManageMembers ? 'Invite Member' : 'Admin or Owner privileges required'}
        >
          {canManageMembers ? <PlusIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
          <span>{canManageMembers ? (isAdding ? 'Close Form' : 'Invite Member') : 'Invite (Admin Only)'}</span>
        </button>
      </div>

      {/* Add New Member Form Panel */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/5 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Add New Collaborator
            </h3>
            <span className="text-xs text-slate-400">All fields required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Connor"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
                Availability Status *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={newMember.status}
                onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
              >
                {TEAM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Confirm & Add Collaborator
            </button>
          </div>
        </form>
      )}

      {/* Search and Role Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Role:</span>
          {['All', 'Lead', 'Developer', 'Designer'].map((filterRole) => (
            <button
              key={filterRole}
              onClick={() => setSelectedRoleFilter(filterRole === 'Lead' ? 'Project Lead' : filterRole === 'Developer' ? 'Fullstack Engineer' : filterRole === 'Designer' ? 'UI/UX Designer' : 'All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                (selectedRoleFilter === 'All' && filterRole === 'All') ||
                (selectedRoleFilter === 'Project Lead' && filterRole === 'Lead') ||
                (selectedRoleFilter === 'Fullstack Engineer' && filterRole === 'Developer') ||
                (selectedRoleFilter === 'UI/UX Designer' && filterRole === 'Designer')
                  ? 'bg-slate-900 text-white shadow-sm'
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
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading team directory...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <TeamIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No members found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'No collaborators matched your filter criteria.' : 'Invite your first collaborator above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredMembers.map((member, idx) => {
            const taskCount = getMemberTaskCount(member.name);
            const statusConfig = getStatusStyle(member.status || 'Active');

            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        idx
                      )} text-white font-bold text-base flex items-center justify-center shadow-md shrink-0`}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-slate-900 leading-snug truncate" title={member.name}>
                        {member.name}
                      </h4>
                      <p className="text-xs text-indigo-600 font-medium truncate" title={member.role || 'Fullstack Engineer'}>
                        {member.role || 'Fullstack Engineer'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate" title={member.email}>
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {canManageMembers ? (
                    <button
                      onClick={() => handleRemove(member._id, member.name)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                      title="Remove member"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <span
                      className="p-1.5 text-slate-300 cursor-not-allowed shrink-0"
                      title="Only Workspace Owners and Admins can remove collaborators"
                    >
                      <LockIcon className="w-3.5 h-3.5 text-slate-300" />
                    </span>
                  )}
                </div>

                {/* Footer: Dynamic Status Switcher + Task Count */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  {/* Interactive Status Selector */}
                  <div className="relative group shrink-0">
                    <select
                      value={member.status || 'Active'}
                      onChange={(e) => handleStatusChange(member._id, member.name, e.target.value)}
                      className={`appearance-none pl-5 pr-4 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${statusConfig.pill}`}
                      title="Click to update availability status"
                    >
                      {TEAM_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-800">
                          {st}
                        </option>
                      ))}
                    </select>
                    {/* Live Dot Indicator */}
                    <span className={`w-2 h-2 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusConfig.dot}`}></span>
                  </div>

                  <span className="text-slate-500 font-medium truncate text-right">
                    <strong className="text-slate-900 font-semibold">{taskCount}</strong> assigned {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Team;
