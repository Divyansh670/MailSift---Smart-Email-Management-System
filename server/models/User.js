const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  preferences: {
    emailFilters: {
      opportunities: { type: Boolean, default: true },
      hackathons: { type: Boolean, default: true },
      contests: { type: Boolean, default: true },
      scholarships: { type: Boolean, default: true },
      jobs: { type: Boolean, default: true },
      events: { type: Boolean, default: true }
    },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      defaultTime: { type: String, default: '1hour' }
    }
  },
  lastEmailSync: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);