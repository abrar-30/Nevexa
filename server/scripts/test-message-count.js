const mongoose = require('mongoose');
const User = require('../models/user.model');
const Message = require('../models/message.model');
require('dotenv').config();

async function testMessageCount() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create test users
    let user1 = await User.findOne({ email: 'user1@test.com' });
    let user2 = await User.findOne({ email: 'user2@test.com' });

    if (!user1) {
      user1 = new User({ name: 'Test User 1', email: 'user1@test.com' });
      await User.register(user1, 'password123');
      console.log('✅ Created user1@test.com');
    }

    if (!user2) {
      user2 = new User({ name: 'Test User 2', email: 'user2@test.com' });
      await User.register(user2, 'password123');
      console.log('✅ Created user2@test.com');
    }

    console.log('\n📧 Creating test messages...');

    // Create some test messages from user2 to user1 (user1 will have unread messages)
    const messages = [
      { sender: user2._id.toString(), receiver: user1._id.toString(), content: 'Hello! This is message 1' },
      { sender: user2._id.toString(), receiver: user1._id.toString(), content: 'Hello! This is message 2' },
      { sender: user2._id.toString(), receiver: user1._id.toString(), content: 'Hello! This is message 3' },
    ];

    for (const msgData of messages) {
      const message = await Message.create(msgData);
      console.log(`✅ Created message: "${message.content}"`);
    }

    // Count messages for user1
    const unreadCount = await Message.countDocuments({
      sender: user2._id.toString(),
      receiver: user1._id.toString()
    });

    console.log('\n📊 Test Results:');
    console.log(`User 1 (${user1.email}) has ${unreadCount} unread messages from User 2`);
    console.log(`User 1 ID: ${user1._id}`);
    console.log(`User 2 ID: ${user2._id}`);

    console.log('\n🔧 To test the message count:');
    console.log('1. Login as user1@test.com (password: password123)');
    console.log('2. Check the navbar and mobile navigation for the message count badge');
    console.log('3. Go to /messages to see the conversations');
    console.log('4. The count should decrease when you open the conversation');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testMessageCount();
