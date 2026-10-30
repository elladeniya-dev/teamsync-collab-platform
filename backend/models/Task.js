import mongoose from 'mongoose';

export const TASK_STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    assignee: String,
    deadline: Date,
    type: {
      type: String,
      enum: ['Meeting', 'Deadline', 'Review'],
      default: 'Review',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'In Progress',
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    githubPrUrl: {
      type: String,
      default: '',
    },
    githubPrNumber: {
      type: Number,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
