// middleware/auth.middleware.js

module.exports = {
  isAuthenticated: (req, res, next) => {
    console.log('🔐 Auth middleware - URL:', req.url);
    console.log('🔐 Auth middleware - Session ID:', req.sessionID);
    console.log('🔐 Auth middleware - Session:', JSON.stringify(req.session, null, 2));
    console.log('🔐 Auth middleware - User:', req.user);
    console.log('🔐 Auth middleware - isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
    console.log('🔐 Auth middleware - Cookies:', req.headers.cookie);
    console.log('🔐 Auth middleware - Passport user in session:', req.session?.passport?.user);
    
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('✅ Authentication successful for user:', req.user?.email || req.user?._id);
      return next();
    }
    
    console.log('❌ Authentication failed');
    console.log('❌ Session passport data:', req.session?.passport);
    console.log('❌ req.user exists:', !!req.user);
    console.log('❌ isAuthenticated function exists:', !!req.isAuthenticated);
    
    return res.status(401).json({ 
      message: 'Unauthorized: Please log in.',
      debug: {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        userExists: !!req.user,
        isAuthenticatedFunction: !!req.isAuthenticated,
        passportUser: req.session?.passport?.user,
        sessionData: req.session,
        cookies: req.headers.cookie
      }
    });
  },

  // Optionally, you can add role-based checks here
  // isAdmin: (req, res, next) => { ... }
};
