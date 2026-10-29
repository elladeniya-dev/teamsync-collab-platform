import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { taskApi, teamApi } from '../api/client';
import Modal from '../components/Modal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  TrashIcon, 
  EditIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  UserIcon
} from '../components/Icons';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState('All');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    deadline: dayjs(),
    type: 'Review'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, memberRes] = await Promise.all([
        taskApi.getAll(),
        teamApi.getAll()
      ]);
      const sorted = (taskRes.data || []).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setTasks(sorted);
      setTeamMembers(memberRes.data || []);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditTaskId(null);
    setTaskForm({
      title: '',
      description: '',
      assignee: teamMembers.length > 0 ? teamMembers[0].name : '',
      deadline: dayjs().add(1, 'day'),
      type: 'Review'
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
      type: task.type || 'Review'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    const { title, assignee, deadline, type } = taskForm;

    if (!title.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Title Required',
        text: 'Please enter a task title.',
        confirmButtonColor: '#4f46e5'
      });
    }

    if (!assignee.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Assignee Required',
        text: 'Please select or enter an assignee.',
        confirmButtonColor: '#4f46e5'
      });
    }

    if (dayjs(deadline).isBefore(dayjs())) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Deadline',
        text: 'Deadline must be set in the future.',
        confirmButtonColor: '#4f46e5'
      });
    }

    try {
      const payload = {
        ...taskForm,
        deadline: taskForm.deadline.toISOString()
      };

      if (isEditing) {
        await taskApi.update(editTaskId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Task deliverables updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await taskApi.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'New task added to board.',
          timer: 1500,
          showConfirmButton: false
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving task:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not save the task. Check server logs.'
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
      confirmButtonText: 'Yes, delete'
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
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete task.' });
      }
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
      const matchAssignee = selectedAssignee === 'All' || t.assignee === selectedAssignee;

      return matchSearch && matchType && matchAssignee;
    });
  }, [tasks, searchQuery, selectedType, selectedAssignee]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Meeting':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200/80',
          border: 'border-l-blue-500'
        };
      case 'Deadline':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200/80',
          border: 'border-l-rose-500'
        };
      case 'Review':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          border: 'border-l-emerald-500'
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-700 border-slate-200',
          border: 'border-l-slate-400'
        };
    }
  };

  const getRelativeInfo = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No deadline', color: 'text-slate-400' };
    const now = new Date();
    const deadline = new Date(deadlineStr);
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const days = Math.abs(Math.round(diffHours / 24));
      return { text: `Overdue by ${days === 0 ? 'hours' : days + 'd'}`, color: 'text-rose-600 font-semibold' };
    }
    if (diffHours <= 24) {
      return { text: 'Due today', color: 'text-amber-600 font-semibold' };
    }
    const days = Math.round(diffHours / 24);
    return { text: `Due in ${days} days`, color: 'text-slate-500' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Task Deliverables</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredTasks.length} of {tasks.length} total tasks
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Type:</span>
          {['All', 'Meeting', 'Deadline', 'Review'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
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

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading tasks from database...
        </div>
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
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const style = getTypeStyle(task.type);
            const relative = getRelativeInfo(task.deadline);
            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden border-l-4 ${style.border}`}
              >
                <div className="p-5 space-y-3">
                  {/* Top line: Type pill + relative due */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style.pill}`}>
                      {task.type}
                    </span>
                    <span className={`text-xs ${relative.color}`}>{relative.text}</span>
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

                  {/* Deadline row */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(task.deadline).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Assignee + Edit/Delete */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                      {task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'NA'}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[110px]">
                      {task.assignee || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit task"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id, task.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete task"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Task Deliverable' : 'Add New Task'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Implement Stripe payment webhook"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              placeholder="Add details, acceptance criteria, or external links..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assignee *
              </label>
              {teamMembers.length > 0 ? (
                <select
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                >
                  <option value="">Select a team member</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m.name}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter assignee name"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  required
                />
              )}
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Type *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
              >
                <option value="Review">Review</option>
                <option value="Meeting">Meeting</option>
                <option value="Deadline">Deadline</option>
              </select>
            </div>
          </div>

          {/* DateTime Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deadline Date & Time *
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex justify-center">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <StaticDateTimePicker
                  orientation="landscape"
                  value={taskForm.deadline}
                  onChange={(newVal) => setTaskForm({ ...taskForm, deadline: newVal })}
                  minDateTime={dayjs()}
                />
              </LocalizationProvider>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
