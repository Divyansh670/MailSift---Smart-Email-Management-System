const { google } = require('googleapis');
const { oauth2Client } = require('../config/googleConfig');
const User = require('../models/User');

class GmailService {
  constructor() {
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async setUserCredentials(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if token needs refresh
      if (new Date() >= user.tokenExpiry) {
        await this.refreshAccessToken(user);
      }

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      return user;
    } catch (error) {
      console.error('Error setting user credentials:', error);
      throw error;
    }
  }

  async refreshAccessToken(user) {
    try {
      oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      user.accessToken = credentials.access_token;
      user.tokenExpiry = new Date(credentials.expiry_date);
      await user.save();

      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  async fetchEmails(userId, options = {}) {
    try {
      await this.setUserCredentials(userId);

      const {
        maxResults = 50,
        query = '',
        pageToken = null
      } = options;

      // Build Gmail search query
      let searchQuery = 'in:inbox';
      if (query) {
        searchQuery += ` ${query}`;
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults,
        pageToken
      });

      const messages = response.data.messages || [];
      const emails = [];

      // Fetch detailed information for each message
      for (const message of messages) {
        try {
          const emailDetail = await this.getEmailDetail(message.id);
          if (emailDetail) {
            emails.push(emailDetail);
          }
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error);
          continue;
        }
      }

      return {
        emails,
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate
      };
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getEmailDetail(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers;

      // Extract email information
      const subject = this.getHeader(headers, 'Subject') || 'No Subject';
      const from = this.getHeader(headers, 'From') || '';
      const to = this.getHeader(headers, 'To') || '';
      const date = this.getHeader(headers, 'Date') || '';

      // Parse sender information
      const senderInfo = this.parseSender(from);
      
      // Extract email body
      const body = this.extractBody(message.payload);

      // Check if email is read
      const isRead = !message.labelIds?.includes('UNREAD');

      return {
        gmailId: message.id,
        threadId: message.threadId,
        subject,
        sender: senderInfo,
        recipients: this.parseRecipients(to),
        body,
        snippet: message.snippet,
        date: new Date(date),
        isRead,
        labels: message.labelIds || [],
        attachments: this.extractAttachments(message.payload)
      };
    } catch (error) {
      console.error('Error getting email detail:', error);
      return null;
    }
  }

  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }

  parseSender(fromHeader) {
    if (!fromHeader) return { name: 'Unknown', email: '', avatar: '' };

    const match = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || fromHeader.match(/^(.+)$/);
    
    if (match && match[2]) {
      return {
        name: match[1].trim().replace(/"/g, ''),
        email: match[2].trim(),
        avatar: this.generateAvatar(match[2].trim())
      };
    } else {
      return {
        name: match ? match[1].trim() : 'Unknown',
        email: match ? match[1].trim() : '',
        avatar: this.generateAvatar(match ? match[1].trim() : '')
      };
    }
  }

  parseRecipients(toHeader) {
    if (!toHeader) return [];
    
    return toHeader.split(',').map(recipient => {
      const trimmed = recipient.trim();
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/) || trimmed.match(/^(.+)$/);
      
      if (match && match[2]) {
        return {
          name: match[1].trim().replace(/"/g, ''),
          email: match[2].trim()
        };
      } else {
        return {
          name: match ? match[1].trim() : 'Unknown',
          email: match ? match[1].trim() : ''
        };
      }
    });
  }

  extractBody(payload) {
    let textBody = '';
    let htmlBody = '';

    const extractFromParts = (parts) => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          textBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          htmlBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    } else if (payload.body.data) {
      if (payload.mimeType === 'text/plain') {
        textBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      text: textBody,
      html: htmlBody
    };
  }

  extractAttachments(payload) {
    const attachments = [];

    const extractFromParts = (parts) => {
      for (const part of parts) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId
          });
        } else if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  generateAvatar(email) {
    // Generate a placeholder avatar URL based on email
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = ['4285f4', '34a853', 'fbbc05', 'ea4335', '9c27b0', '00bcd4'];
    const color = colors[Math.abs(hash) % colors.length];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=${color}&color=fff&size=150`;
  }

  async markAsRead(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  async markAsImportant(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['IMPORTANT']
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking email as important:', error);
      return false;
    }
  }
}

module.exports = new GmailService();