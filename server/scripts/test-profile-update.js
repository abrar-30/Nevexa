const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

async function testProfileUpdate() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Original bio',
        location: 'Original location',
        interests: 'Original interests'
      });
      await User.register(testUser, 'testpassword123');
      console.log('✅ Test user created');
    }

    console.log('Original user data:', {
      id: testUser._id,
      name: testUser.name,
      bio: testUser.bio,
      location: testUser.location,
      interests: testUser.interests
    });

    // Test profile update
    const updates = {
      name: 'Updated Test User',
      bio: 'Updated bio content',
      location: 'Updated location',
      interests: 'Updated interests'
    };

    console.log('Applying updates:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      updates,
      { new: true, runValidators: true }
    ).select('-hash -salt');

    console.log('✅ Profile updated successfully:', {
      id: updatedUser._id,
      name: updatedUser.name,
      bio: updatedUser.bio,
      location: updatedUser.location,
      interests: updatedUser.interests
    });

    // Test validation with invalid data
    console.log('\nTesting validation with invalid data...');
    try {
      await User.findByIdAndUpdate(
        testUser._id,
        { name: 'A' }, // Too short name
        { new: true, runValidators: true }
      );
      console.log('❌ Validation should have failed');
    } catch (validationError) {
      console.log('✅ Validation working correctly:', validationError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testProfileUpdate();
