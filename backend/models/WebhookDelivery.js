import mongoose from 'mongoose';

/**
 * WebhookDelivery Schema
 * Provides idempotency tracking and audit records for inbound webhooks.
 * Prevents replay attacks and duplicate side effects through delivery ID deduplication.
 */
const webhookDeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      default: '',
    },
    sender: {
      type: String,
      default: 'Unknown Sender',
    },
    repository: {
      type: String,
      default: 'teamsync/collab-platform',
    },
    status: {
      type: String,
      enum: ['PROCESSED', 'IGNORED', 'DUPLICATE', 'FAILED', 'VERIFICATION_FAILED'],
      default: 'PROCESSED',
      index: true,
    },
    summary: {
      type: String,
      default: '',
    },
    matchedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    signatureValid: {
      type: Boolean,
      default: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    payloadSnippet: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 60 * 60 * 24 * 30, // Auto-expire after 30 days
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export default mongoose.model('WebhookDelivery', webhookDeliverySchema);
