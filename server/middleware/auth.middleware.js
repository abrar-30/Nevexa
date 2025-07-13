// middleware/auth.middleware.js

module.exports = {
  isAuthenticated: (req, res, next) => {
    console.log('🔐 Auth middleware - URL:', req.url);
    console.log('🔐 Auth middleware - Session ID:', req.sessionID);
    console.log('🔐 Auth middleware - Session:', req.session);
    console.log('🔐 Auth middleware - User:', req.user);
    console.log('🔐 Auth middleware - isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
    console.log('🔐 Auth middleware - Cookies:', req.headers.cookie);
    
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('✅ Authentication successful');
      return next();
    }
    
    console.log('❌ Authentication failed');
    return res.status(401).json({ 
      message: 'Unauthorized: Please log in.',
      debug: {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        userExists: !!req.user,
        isAuthenticatedFunction: !!req.isAuthenticated,
        cookies: req.headers.cookie
      }
    });
  },

  // Optionally, you can add role-based checks here
  // isAdmin: (req, res, next) => { ... }
};
