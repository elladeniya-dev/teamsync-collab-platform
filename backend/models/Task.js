import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  assignee: String,
  deadline: Date,
  type: {
    type: String,
    enum: ['Meeting', 'Deadline', 'Review'],
    default: 'Review'
  }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
