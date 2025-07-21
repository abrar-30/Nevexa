// Get current user's profile with joinedCommunities, followers, and following populated
const getMe = async (req, res) => {
  console.log('JWT User:', req.user);
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const User = require('../models/user.model');
  try {
    // Optimize the query by selecting only necessary fields and limiting population
    const user = await User.findById(req.user._id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt')
      .lean(); // Use lean() for better performance when you don't need Mongoose document methods
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};
exports.getMe = getMe;

// Get user profile by ID with followers and following populated
const getUserById = async (req, res) => {
  const User = require('../models/user.model');
  try {
    const userId = req.params.id;

    // Validate user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add isFollowing property
    let isFollowing = false;
    if (req.user && user.followers) {
      isFollowing = user.followers.some(f => {
        // f can be a populated object or just an ID
        if (typeof f === 'object' && f._id) return f._id.equals(req.user._id);
        return f.equals(req.user._id);
      });
    }

    // Add isFollowing to the returned user object
    const userObj = user.toObject();
    userObj.isFollowing = isFollowing;

    res.json(userObj);
  } catch (err) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
};
exports.getUserById = getUserById;

// Update user profile (self only)
const updateUser = async (req, res) => {
  const User = require('../models/user.model');

  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ error: 'You can only update your own profile.' });
  }

  try {
    const updates = {};
    // Only allow updating certain fields
    ['name', 'avatar', 'location', 'bio', 'interests'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-hash -salt');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(400).json({ error: 'Failed to update user.', details: err.message });
  }
};
exports.updateUser = updateUser;

// Follow a user
const followUser = async (req, res) => {
  const User = require('../models/user.model');
  const userId = req.user._id;
  const targetId = req.params.id;

  if (userId.toString() === targetId) {
    return res.status(400).json({ error: "You can't follow yourself." });
  }

  try {
    await User.findByIdAndUpdate(userId, { $addToSet: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } });
    res.json({ message: "Followed user." });
  } catch (err) {
    res.status(500).json({ error: "Failed to follow user." });
  }
};
exports.followUser = followUser;

// Unfollow a user
const unfollowUser = async (req, res) => {
  const User = require('../models/user.model');
  const userId = req.user._id;
  const targetId = req.params.id;

  if (userId.toString() === targetId) {
    return res.status(400).json({ error: "You can't unfollow yourself." });
  }

  try {
    await User.findByIdAndUpdate(userId, { $pull: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: userId } });
    res.json({ message: "Unfollowed user." });
  } catch (err) {
    res.status(500).json({ error: "Failed to unfollow user." });
  }
};
exports.unfollowUser = unfollowUser;

// Upload user avatar
const uploadAvatar = async (req, res) => {
  const User = require('../models/user.model');

  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ error: 'You can only update your own avatar.' });
  }

  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: req.file.path },
      { new: true }
    ).select('-hash -salt');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Avatar updated.', avatar: user.avatar, user });
  } catch (err) {
    console.error('Error updating avatar:', err);
    res.status(500).json({ error: 'Failed to update avatar.', details: err.message });
  }
};
exports.uploadAvatar = uploadAvatar;

// Search users by name or email, excluding the current user
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";
    const currentUserId = req.user._id.toString();
    const User = require("../models/user.model");
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { avatar: { $regex: query, $options: "i" } }
      ]
    }).select("_id name email avatar");

    // Fetch current user's following list
    let followingSet = new Set();
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      if (currentUser && currentUser.following) {
        followingSet = new Set(currentUser.following.map(id => id.toString()));
      }
    }

    const usersWithIsFollowing = users.map(user => {
      const isFollowing = req.user ? followingSet.has(user._id.toString()) : false;
      return { ...user.toObject(), isFollowing };
    });

    res.json({ users: usersWithIsFollowing });
  } catch (err) {
    res.status(500).json({ error: "Failed to search users" });
  }
};
exports.searchUsers = searchUsers;

// Get all users (with basic info, paginated)
const getAllUsers = async (req, res) => {
  const User = require('../models/user.model');
  try {
    const { limit = 20, skip = 0 } = req.query;
    // Exclude the current user if authenticated
    const filter = req.user ? { _id: { $ne: req.user._id } } : {};
    const users = await User.find(filter)
      .select('-hash -salt')
      .skip(Number(skip))
      .limit(Number(limit));

    // Always fetch the current user's following list from DB for reliability
    let followingSet = new Set();
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      if (currentUser && currentUser.following) {
        followingSet = new Set(currentUser.following.map(id => id.toString()));
      }
    }

    const usersWithIsFollowing = users.map(user => {
      const isFollowing = req.user ? followingSet.has(user._id.toString()) : false;
      return { ...user.toObject(), isFollowing };
    });
    res.json({ users: usersWithIsFollowing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};
exports.getAllUsers = getAllUsers;
exports.searchUsers = searchUsers;

// Get users by IDs (for followers/following lists)
const getUsersByIds = async (req, res) => {
  console.log('getUsersByIds called with query:', req.query);
  console.log('JWT User:', req.user);
  
  const User = require('../models/user.model');
  try {
    const { ids } = req.query;
    if (!ids) {
      console.log('No IDs provided');
      return res.status(400).json({ error: 'User IDs are required' });
    }

    const userIds = ids.split(',').filter(id => id.trim());
    console.log('Filtered user IDs:', userIds);
    
    if (userIds.length === 0) {
      console.log('No valid user IDs found');
      return res.json({ users: [] });
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatar')
      .lean();

    // Fetch current user's following list
    let followingSet = new Set();
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      if (currentUser && currentUser.following) {
        followingSet = new Set(currentUser.following.map(id => id.toString()));
      }
    }

    // Add isFollowing property to each user
    const usersWithIsFollowing = users.map(user => {
      const isFollowing = req.user ? followingSet.has(user._id.toString()) : false;
      return { ...user, isFollowing };
    });

    console.log('Found users:', usersWithIsFollowing.length);
    res.json({ users: usersWithIsFollowing });
  } catch (err) {
    console.error('Error fetching users by IDs:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
exports.getUsersByIds = getUsersByIds;