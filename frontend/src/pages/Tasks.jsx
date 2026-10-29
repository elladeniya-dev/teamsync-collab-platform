import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { taskApi, teamApi } from '../api/client';
import { 
  Modal, 
  PlusIcon, 
  SearchIcon, 
  TrashIcon, 
  EditIcon, 
  ClockIcon, 
  CalendarIcon,
  CheckCircleIcon 
} from '../components';
import { formatDate, getRelativeDeadline } from '../utils/dateUtils';
import { getTypeStyle, TASK_TYPES } from '../utils/taskHelpers';
import dayjs from 'dayjs';

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
    deadline: dayjs().add(1, 'day'),
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
      deadline: dayjs().add(1, 'day').hour(17).minute(0),
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
    const { title, assignee, deadline } = taskForm;

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

    if (!deadline || !dayjs(deadline).isValid() || dayjs(deadline).isBefore(dayjs())) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Deadline',
        text: 'Deadline must be set to a valid future date and time.',
        confirmButtonColor: '#4f46e5'
      });
    }

    try {
      const payload = {
        ...taskForm,
        deadline: dayjs(taskForm.deadline).toISOString()
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full">
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
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition cursor-pointer"
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
          {['All', ...TASK_TYPES].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const style = getTypeStyle(task.type);
            const relative = getRelativeDeadline(task.deadline);
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
                    <span>{formatDate(task.deadline)}</span>
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
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Edit task"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id, task.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
        maxWidth="max-w-xl"
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
                  required
                >
                  <option value="">Select a team member</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m.name}>
                      {m.name} — {m.role || 'Fullstack Engineer'} ({m.status || 'Active'})
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

          {/* Deadline Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Deadline Date & Time *
              </label>
              {taskForm.deadline && dayjs(taskForm.deadline).isValid() && (
                <span className="text-[11px] text-indigo-600 font-medium">
                  Due: {dayjs(taskForm.deadline).format('MMM D, YYYY [at] h:mm A')}
                </span>
              )}
            </div>

            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="datetime-local"
                value={taskForm.deadline && dayjs(taskForm.deadline).isValid() ? dayjs(taskForm.deadline).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: dayjs(e.target.value) })}
                min={dayjs().format('YYYY-MM-DDTHH:mm')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium text-slate-700"
                required
              />
            </div>

            {/* Quick Preset Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setTaskForm({ ...taskForm, deadline: dayjs().add(1, 'day').hour(17).minute(0) })}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition border border-slate-200/60 cursor-pointer"
              >
                Tomorrow 5 PM
              </button>
              <button
                type="button"
                onClick={() => setTaskForm({ ...taskForm, deadline: dayjs().add(3, 'day').hour(17).minute(0) })}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition border border-slate-200/60 cursor-pointer"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => setTaskForm({ ...taskForm, deadline: dayjs().add(7, 'day').hour(17).minute(0) })}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition border border-slate-200/60 cursor-pointer"
              >
                Next Week
              </button>
              <button
                type="button"
                onClick={() => setTaskForm({ ...taskForm, deadline: dayjs().endOf('month').hour(18).minute(0) })}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition border border-slate-200/60 cursor-pointer"
              >
                End of Month
              </button>
            </div>
          </div>

          {/* Form Action Buttons - Always Visible and Clean */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
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
