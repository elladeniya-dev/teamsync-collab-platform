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
    subtasks: [
      {
        title: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],
    comments: [
      {
        author: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, required: true },
          email: { type: String, default: '' },
          avatar: { type: String, default: '' },
          role: { type: String, default: 'Member' },
        },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        actor: {
          name: { type: String, required: true },
          email: { type: String, default: '' },
          avatar: { type: String, default: '' },
        },
        action: { type: String, required: true },
        details: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
