import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { taskApi, teamApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon,
  SearchIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  KanbanIcon,
  ListIcon,
  CheckIcon,
  XIcon
} from '../components/common/Icons';
import { formatDate, formatShortDate, getRelativeDeadline } from '../utils/dateUtils';
import { 
  getTypeStyle, 
  getStatusStyle, 
  getPriorityStyle, 
  TASK_TYPES 
} from '../utils/taskHelpers';

const Calendar = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeWorkspace } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week' | 'agenda'

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Task Details & Edit Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    deadline: dayjs().add(1, 'day'),
    type: 'Deadline',
    status: 'In Progress',
    priority: 'Medium',
    subtasks: [],
  });

  const availableAssignees = useMemo(() => {
    const list = teamMembers.map((m) => m.name).filter(Boolean);
    if (user?.name && !list.includes(user.name)) {
      list.unshift(user.name);
    }
    return list.length > 0 ? list : ['Unassigned'];
  }, [teamMembers, user]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, teamRes] = await Promise.all([
        taskApi.getAll(),
        teamApi.getAll().catch(() => ({ data: [] })),
      ]);
      setTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data || []);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleRemoteTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [...prev, newTask];
      });
    };

    const handleRemoteTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    };

    const handleRemoteTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      if (selectedTask?._id === id) {
        setIsModalOpen(false);
        setSelectedTask(null);
      }
    };

    socket.on('task:created', handleRemoteTaskCreated);
    socket.on('task:updated', handleRemoteTaskUpdated);
    socket.on('task:deleted', handleRemoteTaskDeleted);

    return () => {
      socket.off('task:created', handleRemoteTaskCreated);
      socket.off('task:updated', handleRemoteTaskUpdated);
      socket.off('task:deleted', handleRemoteTaskDeleted);
    };
  }, [socket, selectedTask]);

  // Calendar Navigation
  const prevPeriod = () => {
    if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = selectedType === 'All' || t.type === selectedType;
      const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;

      return matchSearch && matchType && matchPriority;
    });
  }, [tasks, searchQuery, selectedType, selectedPriority]);

  // Key metrics
  const dueTodayCount = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear() &&
        t.status !== 'Done'
      );
    }).length;
  }, [tasks, today]);

  const urgentCount = useMemo(() => {
    return tasks.filter((t) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Done').length;
  }, [tasks]);

  const doneCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'Done').length;
  }, [tasks]);

  const donePercentage = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Month Grid Days calculation
  const monthGridDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const tasksByDay = {};
    filteredTasks.forEach((task) => {
      if (!task.deadline) return;
      const d = new Date(task.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        if (!tasksByDay[dayNum]) tasksByDay[dayNum] = [];
        tasksByDay[dayNum].push(task);
      }
    });

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        currentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
        tasks: [],
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const isToday =
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      const isSelected =
        selectedDate &&
        selectedDate.getDate() === i &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push({
        day: i,
        currentMonth: true,
        tasks: tasksByDay[i] || [],
        isToday,
        isSelected,
        date,
      });
    }

    // Trailing days from next month
    const remainingCells = 42 - days.length;
    const padCount = remainingCells >= 7 ? remainingCells - 7 : remainingCells;
    for (let i = 1; i <= padCount; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i),
        tasks: [],
      });
    }

    return days;
  }, [year, month, filteredTasks, today, selectedDate]);

  // Week View Days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday =
        today.getDate() === d.getDate() &&
        today.getMonth() === d.getMonth() &&
        today.getFullYear() === d.getFullYear();

      const isSelected =
        selectedDate &&
        selectedDate.getDate() === d.getDate() &&
        selectedDate.getMonth() === d.getMonth() &&
        selectedDate.getFullYear() === d.getFullYear();

      const dayTasks = filteredTasks.filter((t) => {
        if (!t.deadline) return false;
        const td = new Date(t.deadline);
        return (
          td.getDate() === d.getDate() &&
          td.getMonth() === d.getMonth() &&
          td.getFullYear() === d.getFullYear()
        );
      });

      days.push({
        date: d,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
        isSelected,
        tasks: dayTasks,
      });
    }
    return days;
  }, [currentDate, filteredTasks, today, selectedDate]);

  // Deliverables scheduled on the actively selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [tasks, selectedDate]);

  // Chronologically upcoming deliverables for workspace timeline
  const upcomingDeliverables = useMemo(() => {
    return [...tasks]
      .filter((t) => t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  }, [tasks]);

  // Modal open handlers
  const openCreateModal = (presetDate = null) => {
    const targetDate = presetDate 
      ? dayjs(presetDate).hour(17).minute(0).second(0) 
      : dayjs().add(1, 'day').hour(17).minute(0).second(0);

    setTaskForm({
      title: '',
      description: '',
      assignee: availableAssignees[0] || (user ? user.name : ''),
      deadline: targetDate,
      type: 'Deadline',
      status: 'In Progress',
      priority: 'Medium',
      subtasks: [],
    });
    setIsEditing(false);
    setEditTaskId(null);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignee: task.assignee || '',
      deadline: task.deadline ? dayjs(task.deadline) : dayjs().add(1, 'day'),
      type: task.type || 'Deadline',
      status: task.status || 'In Progress',
      priority: task.priority || 'Medium',
      subtasks: task.subtasks || [],
    });
    setIsEditing(true);
    setEditTaskId(task._id);
    setIsModalOpen(true);
  };

  // Task Mutations
  const handleSave = async (e) => {
    e?.preventDefault();
    const { title, assignee, deadline } = taskForm;

    if (!title.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Title Required',
        text: 'Please enter a deliverable title.',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }

    if (!assignee.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Assignee Required',
        text: 'Please select or enter an assignee.',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }

    if (!deadline || !dayjs(deadline).isValid()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Deadline',
        text: 'Please choose a valid deadline date and time.',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }

    try {
      const payload = {
        ...taskForm,
        deadline: dayjs(taskForm.deadline).toISOString(),
      };

      if (isEditing && editTaskId) {
        await taskApi.update(editTaskId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Deliverable updated successfully.',
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
      } else {
        await taskApi.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Scheduled',
          text: 'New deliverable added to calendar.',
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving deliverable:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || 'Could not save deliverable.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  };

  const handleAddSubtask = async (taskId, title) => {
    try {
      const res = await taskApi.addSubtask(taskId, title);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      if (selectedTask?._id === taskId) setSelectedTask(res.data);
    } catch (err) {
      console.error('Add subtask error:', err);
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId, completed) => {
    try {
      const res = await taskApi.toggleSubtask(taskId, subtaskId, completed);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      if (selectedTask?._id === taskId) setSelectedTask(res.data);
    } catch (err) {
      console.error('Toggle subtask error:', err);
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const res = await taskApi.deleteSubtask(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      if (selectedTask?._id === taskId) setSelectedTask(res.data);
    } catch (err) {
      console.error('Delete subtask error:', err);
    }
  };

  const handleAddComment = async (taskId, text) => {
    try {
      const res = await taskApi.addComment(taskId, text);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      if (selectedTask?._id === taskId) setSelectedTask(res.data);
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-3 max-w-7xl mx-auto w-full pb-8">
      {/* Sticky Compact Top Control Header */}
      <div className="sticky top-0 z-20 bg-slate-50 pt-1 pb-2 space-y-2.5">
        {/* Main Bar: Title, Period Nav, View Switcher & Actions */}
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: Period Title & Quick Nav */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {viewMode === 'week' 
                    ? `Week of ${weekDays[0]?.fullDateStr} - ${weekDays[6]?.fullDateStr}` 
                    : monthName}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {activeWorkspace?.currentSprint || 'Sprint 1'}
                </span>
              </div>
            </div>

            {/* Time Nav Buttons */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={prevPeriod}
                className="p-1 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer ml-0.5"
                title="Previous"
                aria-label="Previous period"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                className="p-1 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                title="Next"
                aria-label="Next period"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>

          {/* Right: Quick Micro KPIs & Schedule Button */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-500 mr-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                {filteredTasks.length} Milestones
              </span>
              {dueTodayCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                  {dueTodayCount} Due Today
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                {donePercentage}% Done
              </span>
            </div>

            <button
              type="button"
              onClick={() => openCreateModal(selectedDate || new Date())}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Schedule Deliverable</span>
            </button>
          </div>
        </div>

        {/* Filter Ribbon: Search, Type Pills, Priority */}
        <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables or assignees..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type and Priority Filters */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Type:</span>
              {['All', 'Deadline', 'Meeting', 'Review'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    selectedType === type
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2 py-0.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar View Area + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Column (3 cols): Calendar Grid / Week View / Agenda View */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
          {/* 1. MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col">
              {/* Day Headers (Sun-Sat) */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2 select-none">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <div 
                    key={d} 
                    className={`text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-indigo-400' : 'text-slate-500'}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 7-column Calendar Cells Grid */}
              <div className={`flex-1 grid grid-cols-7 divide-x divide-y divide-slate-100 ${monthGridDays.length === 35 ? 'grid-rows-5' : 'grid-rows-6'}`}>
                {monthGridDays.map((cell, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.date) setSelectedDate(cell.date);
                    }}
                    className={`group p-2 flex flex-col justify-start min-h-[92px] transition cursor-pointer relative ${
                      cell.currentMonth ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/30 text-slate-300'
                    } ${cell.isToday ? 'bg-indigo-50/20' : ''} ${cell.isSelected ? 'ring-2 ring-indigo-500/80 ring-inset bg-indigo-50/30' : ''}`}
                  >
                    {/* Day Number and Quick Actions */}
                    <div className="shrink-0 flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition ${
                          cell.isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : cell.isSelected
                            ? 'bg-indigo-100 text-indigo-700 font-extrabold'
                            : cell.currentMonth
                            ? 'text-slate-800'
                            : 'text-slate-300'
                        }`}
                      >
                        {cell.day}
                      </span>

                      <div className="flex items-center gap-1">
                        {cell.tasks && cell.tasks.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 px-1 py-0.2 rounded bg-slate-100">
                            {cell.tasks.length}
                          </span>
                        )}
                        {/* Hover Quick Schedule Button */}
                        {cell.currentMonth && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateModal(cell.date);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="Schedule deliverable for this day"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Chips inside Date Cell */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                      {cell.tasks?.slice(0, 3).map((task) => {
                        const isDone = task.status === 'Done';
                        const typeInfo = getTypeStyle(task.type);
                        const isUrgent = task.priority === 'Urgent';

                        return (
                          <button
                            key={task._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(task);
                            }}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium border transition block shadow-2xs hover:brightness-95 cursor-pointer ${typeInfo.chip} ${
                              isDone ? 'opacity-70 line-through' : ''
                            }`}
                            title={`${task.title} • Assignee: ${task.assignee || 'Unassigned'} • Status: ${task.status}`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isUrgent ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              <span className="truncate">{task.title}</span>
                              {isDone && <CheckIcon className="w-3 h-3 text-emerald-600 shrink-0 ml-auto" />}
                            </div>
                          </button>
                        );
                      })}

                      {cell.tasks && cell.tasks.length > 3 && (
                        <span className="text-[10px] font-semibold text-indigo-600 block text-center pt-0.5">
                          +{cell.tasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW (Clean, anti-overlap layout) */}
          {viewMode === 'week' && (
            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 overflow-x-hidden">
              {weekDays.map((col) => (
                <div 
                  key={col.dayName} 
                  onClick={() => setSelectedDate(col.date)}
                  className={`flex flex-col p-2.5 transition min-w-0 cursor-pointer overflow-x-hidden ${
                    col.isToday 
                      ? 'bg-indigo-50/20' 
                      : col.isSelected
                      ? 'bg-slate-50/90'
                      : 'bg-white hover:bg-slate-50/50'
                  }`}
                >
                  {/* Column Header */}
                  <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        {col.dayName}
                      </span>
                      <span className={`text-sm font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 ${
                        col.isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-800'
                      }`}>
                        {col.dayNum}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModal(col.date);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                      title={`Add deliverable on ${col.fullDateStr}`}
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Column Task Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
                    {col.tasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateModal(col.date);
                        }}
                        className="w-full h-24 rounded-xl border border-dashed border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/20 text-slate-300 hover:text-indigo-500 transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer group"
                      >
                        <PlusIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                        <span>Add</span>
                      </button>
                    ) : (
                      col.tasks.map((task) => {
                        const typeInfo = getTypeStyle(task.type);
                        const isDone = task.status === 'Done';
                        const initials = (task.assignee || 'U').slice(0, 2).toUpperCase();

                        return (
                          <div
                            key={task._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(task);
                            }}
                            className={`p-2 rounded-xl border bg-white shadow-2xs hover:shadow-md transition cursor-pointer group border-slate-200 hover:border-indigo-400 flex flex-col gap-1 overflow-hidden ${
                              isDone ? 'opacity-80' : ''
                            }`}
                          >
                            {/* Row 1: Type Badge & Due Time */}
                            <div className="flex items-center justify-between gap-1 min-w-0">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border truncate ${typeInfo.pill}`}>
                                {task.type}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                                {dayjs(task.deadline).format('h:mm A')}
                              </span>
                            </div>

                            {/* Row 2: Title */}
                            <h4 className={`text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate leading-snug ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}>
                              {task.title}
                            </h4>

                            {/* Row 3: Assignee Initials Avatar & Priority */}
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 min-w-0 mt-0.5">
                              <div className="flex items-center gap-1 min-w-0" title={task.assignee || 'Unassigned'}>
                                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                  {initials}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate">
                                  {task.assignee || 'Unassigned'}
                                </span>
                              </div>

                              <span className={`text-[9px] font-bold px-1 py-0.2 rounded border shrink-0 ${getPriorityStyle(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. AGENDA / SCHEDULE VIEW */}
          {viewMode === 'agenda' && (
            <div className="flex-1 p-4 divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No scheduled deliverables found</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your filters or schedule a new deliverable.</p>
                </div>
              ) : (
                filteredTasks
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .map((task) => {
                    const relative = getRelativeDeadline(task.deadline);
                    const typeInfo = getTypeStyle(task.type);
                    const statusInfo = getStatusStyle(task.status);
                    const isDone = task.status === 'Done';

                    return (
                      <div
                        key={task._id}
                        onClick={() => openEditModal(task)}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl transition cursor-pointer group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold uppercase text-slate-400">
                              {dayjs(task.deadline).format('MMM')}
                            </span>
                            <span className="text-sm font-bold text-slate-800 leading-none">
                              {dayjs(task.deadline).format('DD')}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={`text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </h4>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeInfo.pill}`}>
                                {task.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {task.description || 'No detailed description provided.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 sm:self-center self-end">
                          <span className={`text-xs ${relative.color}`}>
                            {relative.text}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.pill}`}>
                            {task.status}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 col): Selected Date Panel & Upcoming Milestones */}
        <div className="space-y-3">
          {/* Selected Date Card */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Selected Date
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(selectedDate)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition cursor-pointer"
                title="Add task for this date"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Deliverables on Selected Date */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-5 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">No deliverables scheduled</p>
                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDate)}
                    className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    + Add milestone
                  </button>
                </div>
              ) : (
                selectedDateTasks.map((t) => {
                  const typeInfo = getTypeStyle(t.type);
                  return (
                    <div
                      key={t._id}
                      onClick={() => openEditModal(t)}
                      className="p-2.5 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${typeInfo.pill}`}>
                          {t.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {dayjs(t.deadline).format('h:mm A')}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                        {t.title}
                      </h5>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                        <span className="truncate">{t.assignee || 'Unassigned'}</span>
                        <span className="font-semibold text-indigo-600 shrink-0">{t.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Milestones Overview */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upcoming Milestones</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                Next {upcomingDeliverables.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {upcomingDeliverables.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">All caught up!</p>
              ) : (
                upcomingDeliverables.map((item) => {
                  const rel = getRelativeDeadline(item.deadline);
                  return (
                    <div
                      key={item._id}
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-slate-800 truncate">
                          {item.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                          {formatShortDate(item.deadline)} • {item.assignee || 'Unassigned'}
                        </span>
                      </div>
                      <span className={`text-[10px] shrink-0 font-medium ${rel.color}`}>
                        {rel.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clean Agile Types Guide */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Deliverable Types & Priority
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Meeting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>High Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details and Scheduling Modal */}
      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        isEditing={isEditing}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        currentTask={selectedTask}
        onSave={handleSave}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onAddComment={handleAddComment}
        availableAssignees={availableAssignees}
        isGuest={user?.role?.toLowerCase() === 'guest'}
        currentUser={user}
      />
    </div>
  );
};

export default Calendar;
