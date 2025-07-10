// middleware/auth.middleware.js

module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized: Please log in.' });
  },

  // Optionally, you can add role-based checks here
  // isAdmin: (req, res, next) => { ... }
};
