const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  remindAt: {
    type: Date,
    required: true
  },
  reminderType: {
    type: String,
    enum: ['30min', '1hour', '3hours', '1day', '3days', '1week', 'custom'],
    default: '1hour'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'cancelled'],
    default: 'pending'
  },
  notificationMethod: {
    type: String,
    enum: ['email', 'push', 'both'],
    default: 'email'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  metadata: {
    originalEmailSubject: String,
    senderName: String,
    senderEmail: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
reminderSchema.index({ userId: 1, remindAt: 1 });
reminderSchema.index({ status: 1, remindAt: 1 });
reminderSchema.index({ emailId: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);