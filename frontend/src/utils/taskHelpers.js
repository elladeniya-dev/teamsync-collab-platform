/**
 * Task styling and badge mapping utilities.
 */

export const TASK_TYPES = ['Meeting', 'Deadline', 'Review'];

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
