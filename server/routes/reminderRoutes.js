const express = require('express');
const jwt = require('jsonwebtoken');
const reminderService = require('../services/reminderService');
const User = require('../models/User');

const router = express.Router();

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user's reminders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit, page } = req.query;

    const result = await reminderService.getUserReminders(userId, {
      status,
      limit: parseInt(limit) || 50,
      page: parseInt(page) || 1
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create a new reminder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailId, reminderTime, reminderType, notificationMethod } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    const reminder = await reminderService.createReminder(userId, emailId, {
      reminderTime,
      reminderType,
      notificationMethod
    });

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update a reminder
router.put('/:reminderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { reminderId } = req.params;
    const updateData = req.body;

    const reminder = await reminderService.updateReminder(reminderId, userId, updateData);
    
    res.json({
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: error.message || 'Failed to update reminder' });
  }
});

// Cancel a reminder
router.delete('/:reminderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { reminderId } = req.params;

    const reminder = await reminderService.cancelReminder(reminderId, userId);
    
    res.json({
      message: 'Reminder cancelled successfully',
      reminder
    });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel reminder' });
  }
});

// Get reminder statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await reminderService.getUserReminders(userId, { status: 'all', limit: 1000 });
    const reminders = result.reminders;

    const stats = {
      total: reminders.length,
      pending: reminders.filter(r => r.status === 'pending').length,
      sent: reminders.filter(r => r.status === 'sent').length,
      cancelled: reminders.filter(r => r.status === 'cancelled').length,
      upcoming: reminders.filter(r => r.status === 'pending' && new Date(r.remindAt) > new Date()).length,
      overdue: reminders.filter(r => r.status === 'pending' && new Date(r.remindAt) <= new Date()).length
    };

    // Group by reminder type
    const typeStats = {};
    reminders.forEach(reminder => {
      typeStats[reminder.reminderType] = (typeStats[reminder.reminderType] || 0) + 1;
    });

    res.json({
      overview: stats,
      byType: typeStats
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: 'Failed to fetch reminder statistics' });
  }
});

module.exports = router;