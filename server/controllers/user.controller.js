// Get current user's profile with joinedCommunities, followers, and following populated
const getMe = async (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
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
    const user = await User.findById(req.params.id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
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
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-hash -salt');
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user.' });
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
    res.json({ message: 'Avatar updated.', avatar: user.avatar, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update avatar.' });
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
    res.json({ users });
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