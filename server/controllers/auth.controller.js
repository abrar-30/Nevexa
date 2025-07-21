const User = require('../models/user.model');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Get JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production';

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const avatar = req.file ? req.file.path : undefined;
    const userObj = { name, email };
    if (avatar) userObj.avatar = avatar;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const user = new User(userObj);
    await User.register(user, password);

    // Generate JWT after registration
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Login user
exports.login = async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }

    try {
      // Generate JWT on successful login
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login successful',
        user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
        token
      });
    } catch (jwtError) {
      console.error('JWT generation error:', jwtError);
      res.status(500).json({ error: 'Failed to generate authentication token' });
    }
  })(req, res, next);
};

// Logout user (no-op for JWT, but kept for API compatibility)
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful (client should discard JWT)' });
};
