import mongoose from 'mongoose';

/**
 * Immutable AuditLog Schema
 * Tracks every critical mutation, role change, and security access attempt.
 * Enforces tamper-evidence by strictly prohibiting updates and deletions.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        default: 'System',
      },
      email: {
        type: String,
        default: 'system@teamsync.internal',
      },
      role: {
        type: String,
        enum: ['Owner', 'Admin', 'Member', 'Guest', 'System'],
        default: 'Member',
      },
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['Task', 'TeamMember', 'Workspace', 'User', 'Security', 'Auth'],
      index: true,
    },
    resourceId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown Client',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'DENIED', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use createdAt explicitly; updates are forbidden
    versionKey: false,
  }
);

// --- Tamper-Evident Immutability Protection ---
// Rejects any update or delete operations on audit logs at the Mongoose query level.
const forbidMutation = function (next) {
  const err = new Error(
    'Audit Log Immutability Violation: Audit records are permanent and tamper-evident. Modification or deletion is strictly forbidden.'
  );
  err.statusCode = 403;
  next(err);
};

auditLogSchema.pre('updateOne', forbidMutation);
auditLogSchema.pre('updateMany', forbidMutation);
auditLogSchema.pre('findOneAndUpdate', forbidMutation);
auditLogSchema.pre('deleteOne', forbidMutation);
auditLogSchema.pre('deleteMany', forbidMutation);
auditLogSchema.pre('findOneAndDelete', forbidMutation);
auditLogSchema.pre('findOneAndRemove', forbidMutation);

export default mongoose.model('AuditLog', auditLogSchema);
