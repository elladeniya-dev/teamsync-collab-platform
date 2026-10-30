import React, { useState } from 'react';
import { 
  Modal, 
  CheckSquareIcon, 
  SquareIcon, 
  PlusIcon, 
  TrashIcon, 
  MessageSquareIcon, 
  ActivityIcon, 
  ClockIcon, 
  SendIcon,
  CheckCircleIcon,
  GitPullRequestIcon,
  ExternalLinkIcon
} from '../../components';
import { 
  TASK_TYPES, 
  TASK_STATUSES, 
  TASK_PRIORITIES, 
  getTypeStyle, 
  getStatusStyle, 
  getPriorityStyle 
} from '../../utils/taskHelpers';
import { formatDate } from '../../utils/dateUtils';
import dayjs from 'dayjs';

const TaskDetailModal = ({
  isOpen,
  onClose,
  isEditing,
  taskForm,
  setTaskForm,
  currentTask,
  onSave,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddComment,
  availableAssignees = [],
  isGuest = false,
  currentUser = null,
}) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'subtasks' | 'discussion'
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Subtask progress
  const subtasks = currentTask?.subtasks || taskForm.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubtaskSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    if (isEditing && onAddSubtask && currentTask?._id) {
      onAddSubtask(currentTask._id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    } else {
      // Adding locally in create mode
      setTaskForm((prev) => ({
        ...prev,
        subtasks: [
          ...(prev.subtasks || []),
          { title: newSubtaskTitle.trim(), completed: false },
        ],
      }));
      setNewSubtaskTitle('');
    }
  };

  const handleLocalToggleSubtask = (index) => {
    setTaskForm((prev) => {
      const updated = [...(prev.subtasks || [])];
      updated[index] = {
        ...updated[index],
        completed: !updated[index].completed,
      };
      return { ...prev, subtasks: updated };
    });
  };

  const handleLocalDeleteSubtask = (index) => {
    setTaskForm((prev) => {
      const updated = [...(prev.subtasks || [])];
      updated.splice(index, 1);
      return { ...prev, subtasks: updated };
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment || !currentTask?._id) return;

    try {
      setPostingComment(true);
      await onAddComment(currentTask._id, commentText.trim());
      setCommentText('');
    } finally {
      setPostingComment(false);
    }
  };

  const setPresetDeadline = (preset) => {
    let newDate;
    if (preset === 'tomorrow') {
      newDate = dayjs().add(1, 'day').hour(17).minute(0);
    } else if (preset === 'in3days') {
      newDate = dayjs().add(3, 'day').hour(17).minute(0);
    } else if (preset === 'nextweek') {
      newDate = dayjs().add(7, 'day').hour(17).minute(0);
    } else if (preset === 'endofmonth') {
      newDate = dayjs().endOf('month').hour(17).minute(0);
    }
    if (newDate) {
      setTaskForm((prev) => ({ ...prev, deadline: newDate }));
    }
  };

  const comments = currentTask?.comments || [];
  const activities = currentTask?.activity || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Deliverable Details' : 'Add New Task'}
      maxWidth="max-w-2xl"
    >
      {/* Tab Navigation (when editing or viewing details) */}
      {isEditing && (
        <div className="flex items-center gap-1 border-b border-slate-200 pb-3 mb-5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Details & Config
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subtasks')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'subtasks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckSquareIcon className="w-3.5 h-3.5" />
            <span>Checklist</span>
            {totalCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'subtasks' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {completedCount}/{totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'discussion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            <span>Discussion & Activity</span>
            {comments.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'discussion' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {comments.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Linked GitHub PR Banner */}
      {isEditing && currentTask?.githubPrNumber && (
        <div className="mb-4 p-3 bg-slate-900 rounded-xl flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <GitPullRequestIcon className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-purple-300">
              GitHub PR #{currentTask.githubPrNumber} Merged
            </span>
            <span className="text-slate-400 hidden sm:inline">&mdash; Deliverable verified</span>
          </div>
          {currentTask.githubPrUrl && (
            <a
              href={currentTask.githubPrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <span>View PR</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* TAB 1: DETAILS & CONFIG */}
      {(!isEditing || activeTab === 'details') && (
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Implement Stripe payment webhook"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              disabled={isGuest}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Add details, acceptance criteria, or external links..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              disabled={isGuest}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Assignee *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={taskForm.assignee}
                onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                required
                disabled={isGuest}
              >
                <option value="">Select a team member</option>
                {availableAssignees.map((member) => (
                  <option key={member._id} value={member.name}>
                    {member.name} &mdash; {member.role || 'Member'}
                    {member.status ? ` (${member.status})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Type *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                disabled={isGuest}
              >
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Workflow Status
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                disabled={isGuest}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Priority Level
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                disabled={isGuest}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Deadline Date & Time *
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">
                Due: {formatDate(taskForm.deadline)}
              </span>
            </div>
            <input
              type="datetime-local"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              value={dayjs(taskForm.deadline).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: dayjs(e.target.value) })}
              required
              disabled={isGuest}
            />

            {!isGuest && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-slate-500">
                <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Presets:</span>
                {[
                  { id: 'tomorrow', label: 'Tomorrow 5 PM' },
                  { id: 'in3days', label: 'In 3 Days' },
                  { id: 'nextweek', label: 'Next Week' },
                  { id: 'endofmonth', label: 'End of Month' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetDeadline(p.id)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition text-[11px] border border-slate-200 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            {!isGuest && (
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: SUBTASKS & CHECKLIST */}
      {isEditing && activeTab === 'subtasks' && (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Checklist Completion</span>
              <span className="font-mono font-bold text-indigo-600">
                {completedCount} of {totalCount} completed ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Add Subtask Input */}
          {!isGuest && (
            <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add checklist item (e.g. Write unit tests)..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </form>
          )}

          {/* Subtask Items List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {subtasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No checklist items yet. Add subtasks above to break down this deliverable.
              </div>
            ) : (
              subtasks.map((subtask, idx) => {
                const subtaskId = subtask._id || idx;
                return (
                  <div
                    key={subtaskId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      subtask.completed
                        ? 'bg-slate-50/80 border-slate-200/80 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isGuest}
                      onClick={() => {
                        if (isEditing && onToggleSubtask && currentTask?._id && subtask._id) {
                          onToggleSubtask(currentTask._id, subtask._id, !subtask.completed);
                        } else {
                          handleLocalToggleSubtask(idx);
                        }
                      }}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer disabled:cursor-default"
                    >
                      {subtask.completed ? (
                        <CheckSquareIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <SquareIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium truncate ${
                          subtask.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </button>

                    {!isGuest && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing && onDeleteSubtask && currentTask?._id && subtask._id) {
                            onDeleteSubtask(currentTask._id, subtask._id);
                          } else {
                            handleLocalDeleteSubtask(idx);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete subtask"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISCUSSION & ACTIVITY */}
      {isEditing && activeTab === 'discussion' && (
        <div className="space-y-6">
          {/* Comments Feed */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquareIcon className="w-3.5 h-3.5" />
              <span>Team Discussion ({comments.length})</span>
            </h4>

            {/* Post Comment Input */}
            {!isGuest && (
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Write a comment or progress update for the team..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || postingComment}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <SendIcon className="w-3 h-3" />
                    <span>{postingComment ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No comments yet. Start the conversation with your team.
                </div>
              ) : (
                comments.map((comment, i) => (
                  <div
                    key={comment._id || i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {comment.author?.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                            {(comment.author?.name || 'U').slice(0, 1)}
                          </div>
                        )}
                        <strong className="text-slate-800 font-semibold">
                          {comment.author?.name || 'Collaborator'}
                        </strong>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium border border-indigo-200">
                          {comment.author?.role || 'Member'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-7">
                      {comment.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5" />
              <span>Activity Timeline</span>
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {activities.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No activity recorded yet.</p>
              ) : (
                [...activities].reverse().map((act, i) => (
                  <div key={act._id || i} className="flex items-start gap-2.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-800">{act.actor?.name}</span>{' '}
                      <span className="text-slate-500">{act.details || act.action}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;