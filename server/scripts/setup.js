const mongoose = require('mongoose');
const User = require('../models/User');
const Email = require('../models/Email');
const Reminder = require('../models/Reminder');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create indexes for better performance
    console.log('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ googleId: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });

    // Email indexes
    await Email.collection.createIndex({ userId: 1, date: -1 });
    await Email.collection.createIndex({ userId: 1, isImportant: 1 });
    await Email.collection.createIndex({ userId: 1, 'tags.category': 1 });
    await Email.collection.createIndex({ gmailId: 1 }, { unique: true });
    await Email.collection.createIndex({ 
      subject: 'text', 
      'body.text': 'text' 
    });

    // Reminder indexes
    await Reminder.collection.createIndex({ userId: 1, remindAt: 1 });
    await Reminder.collection.createIndex({ status: 1, remindAt: 1 });
    await Reminder.collection.createIndex({ emailId: 1 });

    console.log('Database indexes created successfully');

    // Create sample data (optional)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found. Database is ready for first user registration.');
    } else {
      console.log(`Database contains ${userCount} users`);
    }

    console.log('Database setup completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();