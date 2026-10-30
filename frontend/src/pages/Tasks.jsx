import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { taskApi, teamApi } from '../api/client';
import { 
  PlusIcon, 
  SearchIcon, 
  TrashIcon, 
  EditIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  LockIcon, 
  GitPullRequestIcon, 
  ExternalLinkIcon,
  KanbanIcon,
  ListIcon,
  CheckSquareIcon,
  MessageSquareIcon
} from '../components';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { formatDate, getRelativeDeadline } from '../utils/dateUtils';
import { 
  getTypeStyle, 
  TASK_TYPES, 
  TASK_STATUSES, 
  TASK_PRIORITIES, 
  getStatusStyle, 
  getPriorityStyle 
} from '../utils/taskHelpers';
import dayjs from 'dayjs';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('teamsync_tasks_view') || 'kanban'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const { socket, announceViewChange } = useSocket();

  const isGuest = user?.role?.toLowerCase() === 'guest';
  const canDelete =
    user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState('All');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    deadline: dayjs().add(1, 'day'),
    type: 'Review',
    status: 'In Progress',
    priority: 'Medium',
    subtasks: [],
  });

  const handleSwitchView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('teamsync_tasks_view', mode);
  };

  useEffect(() => {
    fetchData();
    announceViewChange('/tasks');
  }, [announceViewChange]);

  // Real-time WebSocket Listeners for multi-client synchronization
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

    const handleRemoteTeamUpdated = (member) => {
      setTeamMembers((prev) =>
        prev.map((m) => (m._id === member._id ? member : m))
      );
    };

    socket.on('task:created', handleRemoteTaskCreated);
    socket.on('task:updated', handleRemoteTaskUpdated);
    socket.on('task:deleted', handleRemoteTaskDeleted);
    socket.on('team:updated', handleRemoteTeamUpdated);

    return () => {
      socket.off('task:created', handleRemoteTaskCreated);
      socket.off('task:updated', handleRemoteTaskUpdated);
      socket.off('task:deleted', handleRemoteTaskDeleted);
      socket.off('team:updated', handleRemoteTeamUpdated);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, memberRes] = await Promise.all([
        taskApi.getAll(),
        teamApi.getAll(),
      ]);
      const sorted = (taskRes.data || []).sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline)
      );
      setTasks(sorted);
      setTeamMembers(memberRes.data || []);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combined list of team members ensuring current user is always included
  const availableAssignees = useMemo(() => {
    const list = [...teamMembers];
    if (
      user?.name &&
      !list.some(
        (m) =>
          m.name?.toLowerCase() === user.name.toLowerCase() ||
          (user.email && m.email?.toLowerCase() === user.email.toLowerCase())
      )
    ) {
      list.unshift({
        _id: user._id || 'self-assignee',
        name: user.name,
        email: user.email,
        role:
          user.role === 'Owner' || user.role === 'Admin'
            ? 'Project Lead'
            : 'Fullstack Engineer',
        status: 'Active',
      });
    }
    return list;
  }, [teamMembers, user]);

  const handleOpenAdd = (presetStatus = 'In Progress') => {
    setIsEditing(false);
    setEditTaskId(null);
    const defaultAssignee = availableAssignees.some((m) => m.name === user?.name)
      ? user?.name
      : availableAssignees[0]?.name || '';

    setTaskForm({
      title: '',
      description: '',
      assignee: defaultAssignee,
      deadline: dayjs().add(1, 'day').hour(17).minute(0),
      type: 'Review',
      status: presetStatus || 'In Progress',
      priority: 'Medium',
      subtasks: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setIsEditing(true);
    setEditTaskId(task._id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee || '',
      deadline: dayjs(task.deadline),
      type: task.type || 'Review',
      status: task.status || 'In Progress',
      priority: task.priority || 'Medium',
      subtasks: task.subtasks || [],
    });
    setIsModalOpen(true);
  };

  const currentTask = useMemo(() => {
    return tasks.find((t) => t._id === editTaskId) || null;
  }, [tasks, editTaskId]);

  const handleSave = async (e) => {
    e?.preventDefault();
    const { title, assignee, deadline } = taskForm;

    if (!title.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Title Required',
        text: 'Please enter a task title.',
        confirmButtonColor: '#4f46e5',
      });
    }

    if (!assignee.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Assignee Required',
        text: 'Please select or enter an assignee.',
        confirmButtonColor: '#4f46e5',
      });
    }

    if (!deadline || !dayjs(deadline).isValid() || dayjs(deadline).isBefore(dayjs())) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Deadline',
        text: 'Deadline must be set to a valid future date and time.',
        confirmButtonColor: '#4f46e5',
      });
    }

    try {
      const payload = {
        ...taskForm,
        deadline: dayjs(taskForm.deadline).toISOString(),
      };

      if (isEditing) {
        await taskApi.update(editTaskId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Task deliverables updated successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await taskApi.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'New task added to board.',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving task:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || 'Could not save the task.',
      });
    }
  };

  const handleDelete = async (id, title) => {
    const res = await Swal.fire({
      title: `Delete task?`,
      text: `Are you sure you want to permanently delete "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
    });

    if (res.isConfirmed) {
      try {
        await taskApi.delete(id);
        fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Task removed successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete task.' });
      }
    }
  };

  // Optimistic Kanban drag and drop handler
  const handleTaskDrop = async (taskId, newStatus) => {
    const taskToMove = tasks.find((t) => t._id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    const originalTasks = [...tasks];

    // Optimistic local update for instantaneous fluid animation
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskApi.update(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to move task:', err);
      setTasks(originalTasks); // rollback on error
      Swal.fire({
        icon: 'error',
        title: 'Move Failed',
        text: err?.response?.data?.message || 'Could not update task status.',
      });
    }
  };

  // Subtask handlers
  const handleAddSubtask = async (taskId, title) => {
    try {
      const res = await taskApi.addSubtask(taskId, title);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Add subtask error:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add checklist item.' });
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId, completed) => {
    try {
      const res = await taskApi.toggleSubtask(taskId, subtaskId, completed);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Toggle subtask error:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to toggle checklist item.' });
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const res = await taskApi.deleteSubtask(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Delete subtask error:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete checklist item.' });
    }
  };

  // Comment handler
  const handleAddComment = async (taskId, text) => {
    try {
      const res = await taskApi.addComment(taskId, text);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Add comment error:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to post comment.' });
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = selectedType === 'All' || t.type === selectedType;
      const matchStatus =
        selectedStatus === 'All' || (t.status || 'In Progress') === selectedStatus;
      const matchAssignee =
        selectedAssignee === 'All' || t.assignee === selectedAssignee;

      return matchSearch && matchType && matchStatus && matchAssignee;
    });
  }, [tasks, searchQuery, selectedType, selectedStatus, selectedAssignee]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full">
      {/* Top Bar with Title, View Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Task Deliverables
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredTasks.length} of {tasks.length} total tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Interactive Kanban Board view"
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Classic Cards List view"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd('In Progress')}
            disabled={isGuest}
            className={`flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition shrink-0 ${
              isGuest
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-lg cursor-pointer'
            }`}
            title={isGuest ? 'Guests have read-only access to deliverables' : 'Add New Task'}
          >
            {isGuest ? (
              <LockIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
            <span>{isGuest ? 'Read-Only (Guest)' : 'Add New Task'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, description, or assignee..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {viewMode === 'list' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Status:
              </span>
              {['All', ...TASK_STATUSES].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Type:
            </span>
            {['All', ...TASK_TYPES].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedType === type
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Task View: Kanban Board vs Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading tasks from database...
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskDrop={handleTaskDrop}
          onOpenTask={handleOpenEdit}
          onOpenAdd={handleOpenAdd}
          onDelete={handleDelete}
          isGuest={isGuest}
          canDelete={canDelete}
        />
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <CheckCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No matching tasks found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'All'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Get started by creating your first task for the sprint.'}
          </p>
          <button
            onClick={() => handleOpenAdd('In Progress')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        /* Classic List / Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredTasks.map((task) => {
            const style = getTypeStyle(task.type);
            const statusStyle = getStatusStyle(task.status || 'In Progress');
            const relative = getRelativeDeadline(task.deadline);
            const subtasks = task.subtasks || [];
            const completedCount = subtasks.filter((s) => s.completed).length;
            const commentsCount = task.comments?.length || 0;

            return (
              <div
                key={task._id}
                onClick={() => handleOpenEdit(task)}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden border-l-4 cursor-pointer ${style.border}`}
              >
                <div className="p-5 space-y-3">
                  {/* Top line: Type pill + Status pill + relative due */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style.pill}`}
                      >
                        {task.type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusStyle.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                        {task.status || 'In Progress'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityStyle(
                          task.priority || 'Medium'
                        )}`}
                      >
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${relative.color}`}>
                      {relative.text}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Subtask Mini Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <CheckSquareIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {completedCount}/{subtasks.length} Subtasks
                          </span>
                        </span>
                        <span>
                          {Math.round((completedCount / subtasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completedCount === subtasks.length
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${(completedCount / subtasks.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Merged GitHub PR Badge if transitioned via webhook */}
                  {task.githubPrNumber && (
                    <a
                      href={task.githubPrUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono font-semibold hover:bg-slate-800 transition border border-slate-700 w-fit"
                      title="View merged GitHub Pull Request"
                    >
                      <GitPullRequestIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>PR #{task.githubPrNumber} Merged</span>
                      <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
                    </a>
                  )}

                  {/* Deadline row */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(task.deadline)}</span>
                  </div>
                </div>

                {/* Card Footer: Assignee + Comments + Actions */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                      {task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'NA'}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[110px]">
                      {task.assignee || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {commentsCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium"
                        title={`${commentsCount} comments`}
                      >
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        <span>{commentsCount}</span>
                      </span>
                    )}

                    {!isGuest ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(task);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Edit task"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-300 cursor-not-allowed"
                        title="Read-only: Guests cannot edit tasks"
                      >
                        <LockIcon className="w-3.5 h-3.5 text-slate-300" />
                      </span>
                    )}

                    {canDelete ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task._id, task.title);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete task"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-300 cursor-not-allowed"
                        title="Delete requires Admin or Owner role"
                      >
                        <LockIcon className="w-3.5 h-3.5 text-slate-300" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create / Edit / Details Modal */}
      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        currentTask={currentTask}
        onSave={handleSave}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onAddComment={handleAddComment}
        availableAssignees={availableAssignees}
        isGuest={isGuest}
        currentUser={user}
      />
    </div>
  );
};

export default Tasks;