const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

async function testUserProfile() {
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
    let testUser1 = await User.findOne({ email: 'testuser1@example.com' });
    let testUser2 = await User.findOne({ email: 'testuser2@example.com' });

    if (!testUser1) {
      testUser1 = new User({
        name: 'Test User 1',
        email: 'testuser1@example.com',
        bio: 'This is test user 1',
        location: 'Test City',
        interests: 'Testing, Development'
      });
      await User.register(testUser1, 'password123');
      console.log('✅ Created testuser1@example.com');
    }

    if (!testUser2) {
      testUser2 = new User({
        name: 'Test User 2',
        email: 'testuser2@example.com',
        bio: 'This is test user 2',
        location: 'Another Test City',
        interests: 'Testing, QA'
      });
      await User.register(testUser2, 'password123');
      console.log('✅ Created testuser2@example.com');
    }

    // Make them follow each other
    if (!testUser1.following.includes(testUser2._id)) {
      testUser1.following.push(testUser2._id);
      testUser2.followers.push(testUser1._id);
      await testUser1.save();
      await testUser2.save();
      console.log('✅ Set up follow relationship');
    }

    // Test user profile retrieval
    const user1Profile = await User.findById(testUser1._id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt');

    console.log('\n📊 Test User 1 Profile:');
    console.log(`ID: ${user1Profile._id}`);
    console.log(`Name: ${user1Profile.name}`);
    console.log(`Email: ${user1Profile.email}`);
    console.log(`Bio: ${user1Profile.bio}`);
    console.log(`Location: ${user1Profile.location}`);
    console.log(`Interests: ${user1Profile.interests}`);
    console.log(`Followers: ${user1Profile.followers.length}`);
    console.log(`Following: ${user1Profile.following.length}`);

    console.log('\n🔗 Profile URLs to test:');
    console.log(`User 1: http://localhost:3000/profile/${testUser1._id}`);
    console.log(`User 2: http://localhost:3000/profile/${testUser2._id}`);

    console.log('\n🧪 API Endpoints to test:');
    console.log(`GET /api/users/${testUser1._id}`);
    console.log(`GET /api/users/${testUser2._id}`);

    console.log('\n✅ User profile test data created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testUserProfile();
