import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskApi, teamApi } from '../api/client';
import { 
  TasksIcon, 
  CalendarIcon, 
  TeamIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon
} from '../components/Icons';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, memberRes] = await Promise.all([
          taskApi.getAll(),
          teamApi.getAll()
        ]);
        
        const sorted = (taskRes.data || []).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setTasks(sorted);
        setMembers(memberRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const now = new Date();
  const upcomingTasks = tasks.filter(t => new Date(t.deadline) >= now).slice(0, 5);
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < now);
  const meetings = tasks.filter(t => t.type === 'Meeting');

  const getPriorityBadge = (type) => {
    switch (type) {
      case 'Deadline':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'Meeting':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Review':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRelativeDeadline = (deadlineStr) => {
    if (!deadlineStr) return 'No date';
    const deadline = new Date(deadlineStr);
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const days = Math.abs(Math.round(diffHours / 24));
      return { text: `Overdue by ${days === 0 ? 'today' : days + 'd'}`, color: 'text-rose-600 font-semibold' };
    }
    if (diffHours <= 24) {
      return { text: 'Due today', color: 'text-amber-600 font-semibold' };
    }
    if (diffHours <= 48) {
      return { text: 'Due tomorrow', color: 'text-indigo-600 font-medium' };
    }
    const days = Math.round(diffHours / 24);
    return { text: `Due in ${days} days`, color: 'text-slate-500' };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome to TeamSync Workspace</h2>
            <p className="text-indigo-200 text-sm max-w-xl">
              Track deliverables, organize upcoming sprints, and maintain team alignment effortlessly.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/tasks"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Task</span>
            </Link>
            <Link
              to="/calendar"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl backdrop-blur-md border border-white/10 transition"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* Subtle background glow effect */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TasksIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{tasks.length}</span>
            <span className="text-xs text-slate-500">active deliverables</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Meetings</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{meetings.length}</span>
            <span className="text-xs text-slate-500">scheduled syncs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue / Tight</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdueTasks.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{overdueTasks.length}</span>
            <span className="text-xs text-slate-500">{overdueTasks.length > 0 ? 'require attention' : 'all on schedule'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team Members</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TeamIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{members.length}</span>
            <span className="text-xs text-slate-500">collaborators</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Tasks + Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Upcoming Deliverables</span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {upcomingTasks.length}
              </span>
            </h3>
            <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>View all</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                Loading deliverables...
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-slate-700">All caught up!</h4>
                <p className="text-xs text-slate-500 mt-1">No upcoming tasks scheduled right now.</p>
                <Link
                  to="/tasks"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Task
                </Link>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const relative = getRelativeDeadline(task.deadline);
                return (
                  <div
                    key={task._id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadge(task.type)}`}>
                          {task.type}
                        </span>
                        <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {task.title}
                        </h4>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`text-xs ${relative.color}`}>{relative.text}</div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatDate(task.deadline)}</span>
                        </div>
                      </div>

                      {task.assignee && (
                        <div 
                          className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-200"
                          title={`Assigned to ${task.assignee}`}
                        >
                          {task.assignee.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Team Directory Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Team Members</span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {members.length}
              </span>
            </h3>
            <Link to="/team" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Manage</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            {members.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No team members added yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.slice(0, 6).map((member) => (
                  <div key={member._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/team"
              className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Invite New Member</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
