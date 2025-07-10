const User = require('../models/user.model');
const passport = require('passport');

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

    // Log in the user after registration
    req.logIn(user, (err) => {
      if (err) return next(err);
      // After successful registration and login
      res.status(201).json({
        message: 'User registered and logged in successfully',
        user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar }
      });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login user
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ message: 'Login successful', user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    });
  })(req, res, next);
};

// Logout user
exports.logout = (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logout successful' });
  });
};
