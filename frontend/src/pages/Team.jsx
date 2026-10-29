import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { teamApi, taskApi } from '../api/client';
import { 
  TeamIcon, 
  PlusIcon, 
  TrashIcon, 
  UserIcon, 
  CheckCircleIcon,
  SearchIcon 
} from '../components/Icons';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

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
        text: 'Please enter member full name.',
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
      const res = await teamApi.create({ name, email });
      setMembers((prev) => [...prev, res.data]);
      setNewMember({ name: '', email: '' });
      setIsAdding(false);

      Swal.fire({
        icon: 'success',
        title: 'Collaborator Added!',
        text: `${name} has joined the team workspace.`,
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

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const getMemberTaskCount = (memberName) => {
    return tasks.filter((t) => t.assignee?.toLowerCase() === memberName?.toLowerCase()).length;
  };

  // Generate pleasant distinct avatar colors
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Team Directory</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              {members.length} Members
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage teammates and workload distribution</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : 'Invite Member'}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
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
                Email Address
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              Confirm & Add
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter team by name or email..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            {search ? 'No collaborators matched your filter.' : 'Invite your first collaborator above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member, idx) => {
            const taskCount = getMemberTaskCount(member.name);
            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        idx
                      )} text-white font-bold text-base flex items-center justify-center shadow-md`}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {member.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[170px]">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(member._id, member.name)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove member"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>

                  <span className="text-slate-500 font-medium">
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
