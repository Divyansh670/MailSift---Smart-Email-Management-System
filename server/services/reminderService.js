const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const Email = require('../models/Email');

class ReminderService {
  constructor() {
    this.transporter = null;
    this.initializeEmailTransporter();
    this.startReminderScheduler();
  }

  initializeEmailTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  startReminderScheduler() {
    // Run every minute to check for due reminders
    cron.schedule('* * * * *', async () => {
      await this.processDueReminders();
    });

    console.log('Reminder scheduler started');
  }

  async createReminder(userId, emailId, reminderData) {
    try {
      const { reminderTime, reminderType = '1hour', notificationMethod = 'email' } = reminderData;

      // Get email details for metadata
      const email = await Email.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Calculate reminder time
      let remindAt;
      if (reminderType === 'custom') {
        remindAt = new Date(reminderTime);
      } else {
        remindAt = this.calculateReminderTime(reminderType);
      }

      // Create reminder
      const reminder = new Reminder({
        userId,
        emailId,
        title: `Reminder: ${email.subject}`,
        description: `Don't forget to check this email from ${email.sender.name}`,
        remindAt,
        reminderType,
        notificationMethod,
        metadata: {
          originalEmailSubject: email.subject,
          senderName: email.sender.name,
          senderEmail: email.sender.email
        }
      });

      await reminder.save();

      // Update email to indicate it has a reminder
      email.hasReminder = true;
      await email.save();

      return reminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  calculateReminderTime(reminderType) {
    const now = new Date();
    const timeMap = {
      '30min': 30 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '3hours': 3 * 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000,
      '3days': 3 * 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000
    };

    return new Date(now.getTime() + (timeMap[reminderType] || timeMap['1hour']));
  }

  async processDueReminders() {
    try {
      const now = new Date();
      
      // Find all pending reminders that are due
      const dueReminders = await Reminder.find({
        status: 'pending',
        remindAt: { $lte: now }
      }).populate('userId').populate('emailId');

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder);
          
          // Update reminder status
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          await reminder.save();

          console.log(`Reminder sent for email: ${reminder.metadata.originalEmailSubject}`);
        } catch (error) {
          console.error(`Error sending reminder ${reminder._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing due reminders:', error);
    }
  }

  async sendReminder(reminder) {
    const { userId, emailId, title, description, notificationMethod, metadata } = reminder;

    if (notificationMethod === 'email' || notificationMethod === 'both') {
      await this.sendEmailReminder(reminder);
    }

    // Add push notification logic here if needed
    if (notificationMethod === 'push' || notificationMethod === 'both') {
      await this.sendPushReminder(reminder);
    }
  }

  async sendEmailReminder(reminder) {
    try {
      const user = reminder.userId;
      const email = reminder.emailId;

      const mailOptions = {
        from: `"MailSift Reminders" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `📧 ${reminder.title}`,
        html: this.generateReminderEmailTemplate(reminder, user, email)
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email reminder:', error);
      throw error;
    }
  }

  generateReminderEmailTemplate(reminder, user, email) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MailSift Reminder</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #2563eb, #0d9488); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .email-preview { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 MailSift Reminder</h1>
            <p>You asked us to remind you about this email</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>This is your scheduled reminder for the following email:</p>
            
            <div class="email-preview">
              <h3>${email.subject}</h3>
              <p><strong>From:</strong> ${email.sender.name} (${email.sender.email})</p>
              <p><strong>Date:</strong> ${email.date.toLocaleDateString()}</p>
              <p><strong>Preview:</strong> ${email.snippet}</p>
            </div>
            
            <p>Don't forget to take action on this email if needed!</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
              Open MailSift Dashboard
            </a>
          </div>
          
          <div class="footer">
            <p>This reminder was sent by MailSift. You can manage your reminders in your dashboard.</p>
            <p>© 2024 MailSift. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPushReminder(reminder) {
    // Placeholder for push notification implementation
    // You can integrate with services like Firebase Cloud Messaging, OneSignal, etc.
    console.log('Push notification would be sent here:', reminder.title);
  }

  async getUserReminders(userId, options = {}) {
    try {
      const { status = 'all', limit = 50, page = 1 } = options;
      
      let query = { userId };
      if (status !== 'all') {
        query.status = status;
      }

      const reminders = await Reminder.find(query)
        .populate('emailId')
        .sort({ remindAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Reminder.countDocuments(query);

      return {
        reminders,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting user reminders:', error);
      throw error;
    }
  }

  async cancelReminder(reminderId, userId) {
    try {
      const reminder = await Reminder.findOne({ _id: reminderId, userId });
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      reminder.status = 'cancelled';
      await reminder.save();

      // Update email reminder status
      const email = await Email.findById(reminder.emailId);
      if (email) {
        const hasOtherReminders = await Reminder.findOne({
          emailId: reminder.emailId,
          status: 'pending'
        });
        
        if (!hasOtherReminders) {
          email.hasReminder = false;
          await email.save();
        }
      }

      return reminder;
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      throw error;
    }
  }

  async updateReminder(reminderId, userId, updateData) {
    try {
      const reminder = await Reminder.findOne({ _id: reminderId, userId });
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // Only allow updates to pending reminders
      if (reminder.status !== 'pending') {
        throw new Error('Cannot update non-pending reminder');
      }

      Object.assign(reminder, updateData);
      await reminder.save();

      return reminder;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();