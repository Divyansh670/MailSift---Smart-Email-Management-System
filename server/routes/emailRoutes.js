const express = require('express');
const jwt = require('jsonwebtoken');
const gmailService = require('../services/gmailService');
const filterService = require('../services/filterService');
const reminderService = require('../services/reminderService');
const Email = require('../models/Email');
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

// Fetch and sync emails from Gmail
router.get('/sync', authenticateToken, async (req, res) => {
  try {
    const { maxResults = 50, query = '', pageToken } = req.query;
    const userId = req.user._id;

    // Fetch emails from Gmail
    const gmailData = await gmailService.fetchEmails(userId, {
      maxResults: parseInt(maxResults),
      query,
      pageToken
    });

    const processedEmails = [];

    // Process each email
    for (const emailData of gmailData.emails) {
      try {
        // Check if email already exists in database
        let existingEmail = await Email.findOne({ gmailId: emailData.gmailId, userId });

        if (!existingEmail) {
          // Apply filtering to new email
          const filterResults = await filterService.filterEmail(emailData);

          // Create new email record
          const newEmail = new Email({
            userId,
            gmailId: emailData.gmailId,
            threadId: emailData.threadId,
            subject: emailData.subject,
            sender: emailData.sender,
            recipients: emailData.recipients,
            body: emailData.body,
            snippet: emailData.snippet,
            date: emailData.date,
            isRead: emailData.isRead,
            isImportant: filterResults.isImportant,
            priority: filterResults.priority,
            tags: filterResults.tags,
            mlPrediction: filterResults.mlPrediction,
            attachments: emailData.attachments,
            labels: emailData.labels
          });

          await newEmail.save();
          processedEmails.push(newEmail);
        } else {
          // Update existing email if needed
          existingEmail.isRead = emailData.isRead;
          existingEmail.labels = emailData.labels;
          await existingEmail.save();
          processedEmails.push(existingEmail);
        }
      } catch (error) {
        console.error(`Error processing email ${emailData.gmailId}:`, error);
        continue;
      }
    }

    // Update user's last sync time
    req.user.lastEmailSync = new Date();
    await req.user.save();

    res.json({
      emails: processedEmails,
      nextPageToken: gmailData.nextPageToken,
      totalSynced: processedEmails.length,
      lastSync: req.user.lastEmailSync
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
});

// Get filtered emails from database
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      priority,
      isImportant,
      isRead,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const userId = req.user._id;
    let query = { userId };

    // Apply filters
    if (category && category !== 'all') {
      query['tags.category'] = category;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isImportant !== undefined) {
      query.isImportant = isImportant === 'true';
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'sender.email': { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    if (sortBy === 'date') {
      sortObj.date = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      sortObj.priority = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query
    const emails = await Email.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Email.countDocuments(query);

    // Get category counts
    const categoryCounts = await Email.aggregate([
      { $match: { userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags.category', count: { $sum: 1 } } }
    ]);

    const counts = {
      all: await Email.countDocuments({ userId }),
      important: await Email.countDocuments({ userId, isImportant: true }),
      unread: await Email.countDocuments({ userId, isRead: false })
    };

    categoryCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json({
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      counts
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get single email details
router.get('/:emailId', authenticateToken, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Mark email as important/unimportant
router.patch('/:emailId/important', authenticateToken, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isImportant } = req.body;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    email.isImportant = isImportant;
    await email.save();

    // Also mark in Gmail if possible
    try {
      if (isImportant) {
        await gmailService.markAsImportant(email.gmailId);
      }
    } catch (gmailError) {
      console.warn('Failed to update Gmail importance:', gmailError.message);
    }

    res.json({ message: 'Email importance updated', email });
  } catch (error) {
    console.error('Error updating email importance:', error);
    res.status(500).json({ error: 'Failed to update email importance' });
  }
});

// Mark email as read/unread
router.patch('/:emailId/read', authenticateToken, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isRead } = req.body;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    email.isRead = isRead;
    await email.save();

    // Also mark in Gmail if marking as read
    try {
      if (isRead) {
        await gmailService.markAsRead(email.gmailId);
      }
    } catch (gmailError) {
      console.warn('Failed to update Gmail read status:', gmailError.message);
    }

    res.json({ message: 'Email read status updated', email });
  } catch (error) {
    console.error('Error updating email read status:', error);
    res.status(500).json({ error: 'Failed to update email read status' });
  }
});

// Create reminder for email
router.post('/:emailId/reminder', authenticateToken, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user._id;
    const reminderData = req.body;

    // Verify email exists and belongs to user
    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const reminder = await reminderService.createReminder(userId, emailId, reminderData);
    res.json({ message: 'Reminder created successfully', reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Get email statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Email.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          important: { $sum: { $cond: ['$isImportant', 1, 0] } },
          unread: { $sum: { $cond: ['$isRead', 0, 1] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Email.aggregate([
      { $match: { userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentActivity = await Email.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject sender.name createdAt isImportant')
      .lean();

    res.json({
      overview: stats[0] || { total: 0, important: 0, unread: 0, highPriority: 0 },
      categories: categoryStats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email statistics' });
  }
});

module.exports = router;