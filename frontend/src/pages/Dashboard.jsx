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
} from '../components';
import { formatDate, getRelativeDeadline } from '../utils/dateUtils';
import { getTypeStyle } from '../utils/taskHelpers';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, announceViewChange } = useSocket();

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
    announceViewChange('/');
  }, [announceViewChange]);

  // Real-time synchronization for dashboard KPIs and feeds
  useEffect(() => {
    if (!socket) return;

    const handleRemoteTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [...prev, newTask].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      });
    };

    const handleRemoteTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev
          .map((t) => (t._id === updatedTask._id ? updatedTask : t))
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      );
    };

    const handleRemoteTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    };

    const handleRemoteTeamCreated = (newMember) => {
      setMembers((prev) => [newMember, ...prev]);
    };

    const handleRemoteTeamUpdated = (member) => {
      setMembers((prev) =>
        prev.map((m) => (m._id === member._id ? member : m))
      );
    };

    const handleRemoteTeamDeleted = ({ id }) => {
      setMembers((prev) => prev.filter((m) => m._id !== id));
    };

    socket.on('task:created', handleRemoteTaskCreated);
    socket.on('task:updated', handleRemoteTaskUpdated);
    socket.on('task:deleted', handleRemoteTaskDeleted);
    socket.on('team:created', handleRemoteTeamCreated);
    socket.on('team:updated', handleRemoteTeamUpdated);
    socket.on('team:deleted', handleRemoteTeamDeleted);

    return () => {
      socket.off('task:created', handleRemoteTaskCreated);
      socket.off('task:updated', handleRemoteTaskUpdated);
      socket.off('task:deleted', handleRemoteTaskDeleted);
      socket.off('team:created', handleRemoteTeamCreated);
      socket.off('team:updated', handleRemoteTeamUpdated);
      socket.off('team:deleted', handleRemoteTeamDeleted);
    };
  }, [socket]);

  const now = new Date();
  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const upcomingTasks = tasks.filter((t) => new Date(t.deadline) >= now && t.status !== 'Done').slice(0, 5);
  const overdueTasks = tasks.filter((t) => new Date(t.deadline) < now && t.status !== 'Done');
  const meetings = tasks.filter((t) => t.type === 'Meeting');

  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full">
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
            <span className="text-xs text-slate-500 font-medium">
              {completedTasks.length} done ({tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%)
            </span>
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
                const style = getTypeStyle(task.type);
                return (
                  <div
                    key={task._id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style.pill}`}>
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
                {members.slice(0, 6).map((member) => {
                  const statusColors = {
                    'In a Meeting': 'text-amber-700 bg-amber-50 border-amber-200/60',
                    'Away': 'text-blue-700 bg-blue-50 border-blue-200/60',
                    'Offline': 'text-slate-600 bg-slate-100 border-slate-200/60',
                    'Active': 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                  };
                  const currentStatus = member.status || 'Active';
                  const badgeStyle = statusColors[currentStatus] || statusColors['Active'];

                  return (
                    <div key={member._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-sm shrink-0">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                          <p className="text-xs text-indigo-600 font-medium truncate">{member.role || 'Fullstack Engineer'}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}>
                        {currentStatus}
                      </span>
                    </div>
                  );
                })}
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
