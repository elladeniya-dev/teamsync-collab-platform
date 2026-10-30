import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      unique: true,
      trim: true,
    },
    currentSprint: {
      type: String,
      default: 'Sprint 1',
      trim: true,
    },
    sprints: {
      type: [String],
      default: ['Sprint 1', 'Sprint 2', 'Backlog'],
    },
    description: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Workspace', workspaceSchema);
