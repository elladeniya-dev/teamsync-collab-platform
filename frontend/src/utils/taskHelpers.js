/**
 * Task styling and badge mapping utilities.
 */

export const TASK_TYPES = ['Meeting', 'Deadline', 'Review'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const getStatusStyle = (status) => {
  switch (status) {
    case 'Done':
      return {
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
      };
    case 'In Review':
      return {
        pill: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        dot: 'bg-indigo-500',
      };
    case 'In Progress':
      return {
        pill: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'Todo':
    default:
      return {
        pill: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-500/10 text-rose-600 border-rose-200';
    case 'High':
      return 'bg-amber-500/10 text-amber-600 border-amber-200';
    case 'Medium':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'Low':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const getTypeStyle = (type) => {
  switch (type) {
    case 'Meeting':
      return {
        pill: 'bg-blue-50 text-blue-700 border-blue-200/80',
        chip: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        border: 'border-l-blue-500',
      };
    case 'Deadline':
      return {
        pill: 'bg-rose-50 text-rose-700 border-rose-200/80',
        chip: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200',
        border: 'border-l-rose-500',
      };
    case 'Review':
      return {
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        chip: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
        border: 'border-l-emerald-500',
      };
    default:
      return {
        pill: 'bg-slate-100 text-slate-700 border-slate-200',
        chip: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200',
        border: 'border-l-slate-400',
      };
  }
};
