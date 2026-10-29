import mongoose from 'mongoose';

export const TEAM_ROLES = [
  'Project Lead',
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Engineer',
  'UI/UX Designer',
  'DevOps Engineer',
  'QA Specialist',
  'Product Manager',
];

export const TEAM_STATUSES = [
  'Active',
  'In a Meeting',
  'Away',
  'Offline',
];

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Collaborator name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Collaborator email is required'],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: TEAM_ROLES,
      default: 'Fullstack Engineer',
    },
    status: {
      type: String,
      enum: TEAM_STATUSES,
      default: 'Active',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('TeamMember', teamMemberSchema);
