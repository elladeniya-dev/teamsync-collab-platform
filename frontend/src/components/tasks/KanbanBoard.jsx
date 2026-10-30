import React, { useState } from 'react';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  GitPullRequestIcon, 
  ExternalLinkIcon,
  LockIcon,
  MessageSquareIcon,
  CheckSquareIcon
} from '../common/Icons';
import { 
  KANBAN_COLUMNS, 
  getTypeStyle, 
  getPriorityStyle 
} from '../../utils/taskHelpers';
import { formatDate, getRelativeDeadline } from '../../utils/dateUtils';

const KanbanBoard = ({
  tasks = [],
  onTaskDrop,
  onOpenTask,
  onOpenAdd,
  onDelete,
  isGuest = false,
  canDelete = false,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, taskId) => {
    if (isGuest) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, columnId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
      {KANBAN_COLUMNS.map((column) => {
        // Filter tasks that belong to this column
        const columnTasks = tasks.filter((t) => {
          const s = t.status || 'In Progress';
          if (column.id === 'Todo') return s === 'Todo' || s === 'To Do';
          if (column.id === 'In Review') return s === 'In Review' || s === 'Under Review';
          return s === column.id;
        });

        const isOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={(e) => handleDragLeave(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col bg-slate-100/70 border rounded-2xl p-3.5 transition-all duration-200 min-h-[500px] ${
              isOver
                ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md'
                : 'border-slate-200/80'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`}></span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {column.title}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                  {columnTasks.length}
                </span>
              </div>

              {!isGuest && onOpenAdd && (
                <button
                  type="button"
                  onClick={() => onOpenAdd(column.id)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition cursor-pointer"
                  title={`Add deliverable to ${column.title}`}
                  aria-label={`Add task to ${column.title}`}
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Column Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {columnTasks.length === 0 ? (
                <div
                  className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-3 transition-colors ${
                    isOver
                      ? 'border-indigo-400 bg-indigo-50/60 text-indigo-700'
                      : 'border-slate-200/90 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-medium">
                    {isOver ? 'Drop task here' : 'No deliverables'}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isOver ? 'Release to change status' : 'Drag tasks here or click +'}
                  </span>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const style = getTypeStyle(task.type);
                  const relative = getRelativeDeadline(task.deadline);
                  const isDragging = draggedTaskId === task._id;

                  // Subtasks calculation
                  const subtasks = task.subtasks || [];
                  const completedSubtasks = subtasks.filter((s) => s.completed).length;
                  const totalSubtasks = subtasks.length;
                  const subtaskProgress =
                    totalSubtasks > 0
                      ? Math.round((completedSubtasks / totalSubtasks) * 100)
                      : 0;

                  const commentsCount = task.comments?.length || 0;

                  return (
                    <div
                      key={task._id}
                      draggable={!isGuest}
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onOpenTask && onOpenTask(task)}
                      className={`group bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-150 p-3.5 space-y-2.5 cursor-pointer relative border-l-4 ${
                        style.border
                      } ${
                        isDragging ? 'opacity-40 scale-95 ring-2 ring-indigo-500' : 'opacity-100'
                      }`}
                    >
                      {/* Top Badges: Type & Priority */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${style.pill}`}
                          >
                            {task.type}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getPriorityStyle(
                              task.priority || 'Medium'
                            )}`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                        </div>

                        <span className={`text-[11px] font-medium ${relative.color}`}>
                          {relative.text}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Subtask Progress Bar (if subtasks exist) */}
                      {totalSubtasks > 0 && (
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckSquareIcon className="w-3 h-3 text-slate-400" />
                              <span>
                                {completedSubtasks}/{totalSubtasks} Subtasks
                              </span>
                            </span>
                            <span className="font-semibold text-slate-700">
                              {subtaskProgress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${subtaskProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Linked GitHub PR (if merged via webhook) */}
                      {task.githubPrNumber && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-purple-300 text-[10px] font-mono font-medium">
                          <GitPullRequestIcon className="w-3 h-3 text-purple-400" />
                          <span>PR #{task.githubPrNumber} Merged</span>
                        </div>
                      )}

                      {/* Card Footer: Assignee + Comments + Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-indigo-200 shrink-0">
                            {task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[85px]">
                            {task.assignee || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Comments Indicator */}
                          {commentsCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium"
                              title={`${commentsCount} comments`}
                            >
                              <MessageSquareIcon className="w-3 h-3" />
                              <span>{commentsCount}</span>
                            </span>
                          )}

                          {/* Quick Edit */}
                          {!isGuest && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTask && onOpenTask(task);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Edit deliverable"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Delete */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete && onDelete(task._id, task.title);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete deliverable"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;