/**
 * Date utility helpers for TeamSync deliverables and milestones.
 */

export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return 'No date';
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Date(dateStr).toLocaleString('en-US', defaultOptions);
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getRelativeDeadline = (deadlineStr) => {
  if (!deadlineStr) return { text: 'No deadline', color: 'text-slate-400' };
  
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffHours = (deadline - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const days = Math.abs(Math.round(diffHours / 24));
    return {
      text: `Overdue by ${days === 0 ? 'today' : days + 'd'}`,
      color: 'text-rose-600 font-semibold',
      isOverdue: true,
    };
  }
  if (diffHours <= 24) {
    return { text: 'Due today', color: 'text-amber-600 font-semibold', isDueSoon: true };
  }
  if (diffHours <= 48) {
    return { text: 'Due tomorrow', color: 'text-indigo-600 font-medium', isDueSoon: true };
  }
  
  const days = Math.round(diffHours / 24);
  return { text: `Due in ${days} days`, color: 'text-slate-500', isDueSoon: false };
};
