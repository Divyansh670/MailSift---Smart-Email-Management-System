const { google } = require('googleapis');
const User = require('../models/User');

class TokenManager {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async refreshUserToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Set refresh token
      this.oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });

      // Refresh the access token
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update user with new tokens
      user.accessToken = credentials.access_token;
      user.tokenExpiry = new Date(credentials.expiry_date);
      
      if (credentials.refresh_token) {
        user.refreshToken = credentials.refresh_token;
      }

      await user.save();

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async validateToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      const now = new Date();
      const tokenExpiry = new Date(user.tokenExpiry);

      // Check if token is expired
      if (now >= tokenExpiry) {
        try {
          // Try to refresh the token
          await this.refreshUserToken(userId);
          return { valid: true, refreshed: true };
        } catch (refreshError) {
          return { valid: false, error: 'Token expired and refresh failed' };
        }
      }

      return { valid: true, refreshed: false };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  async revokeToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Revoke the token with Google
      this.oauth2Client.setCredentials({
        access_token: user.accessToken
      });

      await this.oauth2Client.revokeCredentials();

      // Clear tokens from database
      user.accessToken = null;
      user.refreshToken = null;
      user.tokenExpiry = null;
      user.isActive = false;
      await user.save();

      return { success: true };
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  async getValidToken(userId) {
    try {
      const validation = await this.validateToken(userId);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const user = await User.findById(userId);
      return user.accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      throw error;
    }
  }
}

module.exports = new TokenManager();