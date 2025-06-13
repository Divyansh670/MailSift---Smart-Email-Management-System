const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gmailId: {
    type: String,
    required: true,
    unique: true
  },
  threadId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  sender: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: '' }
  },
  recipients: [{
    name: String,
    email: String
  }],
  body: {
    text: String,
    html: String
  },
  snippet: {
    type: String,
    maxlength: 500
  },
  date: {
    type: Date,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  tags: [{
    label: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['opportunities', 'hackathons', 'contests', 'scholarships', 'jobs', 'events', 'other'],
      required: true 
    },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 }
  }],
  mlPrediction: {
    isImportant: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    categories: [{
      name: String,
      confidence: Number
    }]
  },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String
  }],
  labels: [String],
  hasReminder: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emailSchema.index({ userId: 1, date: -1 });
emailSchema.index({ userId: 1, isImportant: 1 });
emailSchema.index({ userId: 1, 'tags.category': 1 });
emailSchema.index({ gmailId: 1 });
emailSchema.index({ subject: 'text', 'body.text': 'text' });

module.exports = mongoose.model('Email', emailSchema);