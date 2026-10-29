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

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
