// Get current user's profile with joinedCommunities, followers, and following populated
exports.getMe = async (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const User = require('../models/user.model');
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

// Get user profile by ID with followers and following populated
exports.getUserById = async (req, res) => {
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

// Update user profile (self only)
exports.updateUser = async (req, res) => {
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

// Follow a user
exports.followUser = async (req, res) => {
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

// Unfollow a user
exports.unfollowUser = async (req, res) => {
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

// Upload user avatar
exports.uploadAvatar = async (req, res) => {
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

// Search users by name, email, or bio
exports.searchUsers = async (req, res) => {
  const User = require('../models/user.model');
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query (q)' });
    }
    const regex = new RegExp(q, "i");
    const searchFilter = {
      $and: [
        {
          $or: [
            { name: regex },
            { email: regex },
            { bio: regex },
            { location: regex }
          ]
        },
        // Exclude current user if authenticated
        ...(req.user ? [{ _id: { $ne: req.user._id } }] : [])
      ]
    };
    const users = await User.find(searchFilter)
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
    res.status(500).json({ error: err.message });
  }
};

// Get all users (with basic info, paginated)
exports.getAllUsers = async (req, res) => {
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