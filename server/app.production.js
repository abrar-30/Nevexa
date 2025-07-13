// Production-ready server configuration
// Required environment variables:
// - MONGODB_URI: MongoDB connection string
// - SESSION_SECRET: Secret for session encryption
// - NODE_ENV: Set to 'production'
// - PORT: Port to run the server (defaults to 5000)

const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression');
const { Server } = require('socket.io');
const { socketHandler } = require('./sockets/index');
const connectDB = require('./db/connect');
const passport = require('passport');
const User = require('./models/user.model');
const errorHandler = require('./middleware/error.middleware');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Initialize Express app
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Debug environment
console.log('🌍 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isProduction:', isProduction);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);

// Force production mode if running on Render (even if NODE_ENV is not set correctly)
const isRenderDeployment = process.env.RENDER || process.env.RENDER_SERVICE_ID;
const forceProduction = isRenderDeployment || process.env.FORCE_PRODUCTION === 'true';
const actuallyProduction = isProduction || forceProduction;

console.log('🚀 Deployment Detection:');
console.log('isRenderDeployment:', !!isRenderDeployment);
console.log('forceProduction:', forceProduction);
console.log('actuallyProduction:', actuallyProduction);

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  connectDB().catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
} else {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// Ensure session secret is set
if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET environment variable is required');
  process.exit(1);
}

// Add compression middleware for better performance
app.use(compression());

// CORS configuration - CRITICAL for cross-domain cookies
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nevexa.vercel.app',
  'https://nevexa-git-main-abrar-30s-projects.vercel.app',
  'https://nevexa-abrar-30s-projects.vercel.app',
  // Add any other Vercel preview URLs
  /^https:\/\/nevexa-.*\.vercel\.app$/
  // Add any other production domains here
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed list or matches regex patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS allowed for: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error(`CORS not allowed for ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Body parser middleware with size limits
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '10mb' }));

// Session configuration with MongoDB store - Mobile-optimized
app.use(session({
  name: 'connect.sid', // Use standard session name for better compatibility
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Important for proxied environments like Render
  rolling: true, // Reset expiration on each request - important for mobile
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds (longer for mobile)
    touchAfter: 60 * 60 // Update session every hour instead of daily
  }),
  cookie: {
    httpOnly: true,
    // Try 'lax' for mobile compatibility - many mobile browsers have issues with 'none'
    sameSite: 'lax', // Changed from 'none' to 'lax' for better mobile compatibility
    secure: actuallyProduction, // Only secure in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (longer for mobile users)
    domain: undefined, // Let browser handle domain automatically
    path: '/' // Explicit path
  }
}));

// Mobile detection and session handling middleware
app.use((req, res, next) => {
  // Detect mobile browsers
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Add mobile flag to request
  req.isMobile = isMobile;
  
  // For mobile browsers, adjust cookie settings dynamically
  if (isMobile && req.session) {
    // For mobile, try more permissive cookie settings
    req.session.cookie.sameSite = 'lax'; // More compatible with mobile browsers
    req.session.cookie.secure = actuallyProduction; // Keep secure in production
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // If user is authenticated, extend session
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.session.touch(); // Update session timestamp
    }
  }
  
  next();
});

// Debug middleware to check session and cookies
app.use((req, res, next) => {
  if (req.url.includes('/api/')) {
    console.log('🔐 Request URL:', req.url);
    console.log('🔐 Session ID:', req.sessionID);
    console.log('🔐 Is Mobile:', req.isMobile);
    console.log('🔐 Session data:', JSON.stringify(req.session, null, 2));
    console.log('🔐 User authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
    console.log('🔐 req.user:', req.user);
    console.log('🔐 All cookies:', req.headers.cookie);
  }
  
  next();
});

// Additional headers for cross-origin cookie handling
app.use((req, res, next) => {
  // ALWAYS set these headers for cross-domain cookies
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  
  // Additional headers for mobile cookie compatibility
  if (req.isMobile) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(200);
  }
  
  next();
});

// Authentication setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());

// Custom serialization with debugging
passport.serializeUser((user, done) => {
  console.log('🔐 Serializing user:', user.email);
  done(null, user.email); // Store email in session
});

passport.deserializeUser(async (email, done) => {
  console.log('🔐 Deserializing user with email:', email);
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      console.log('✅ User found during deserialization:', user.email);
      done(null, user);
    } else {
      console.log('❌ User not found during deserialization for email:', email);
      done(null, false);
    }
  } catch (error) {
    console.error('❌ Error during user deserialization:', error);
    done(error, null);
  }
});

// API Routes
const authRoutes = require('./routes/auth.route');
const postRoutes = require('./routes/post.route');
const chatRoutes = require('./routes/chat.route');
const adminRoutes = require('./routes/admin.route');
const userRoutes = require('./routes/user.route');
const commentRoutes = require('./routes/comment.route');
const reportRoutes = require('./routes/report.route');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// Authentication test endpoint
app.get('/api/auth-test', (req, res) => {
  console.log('🔍 Auth test - Session ID:', req.sessionID);
  console.log('🔍 Auth test - Session:', req.session);
  console.log('🔍 Auth test - User:', req.user);
  console.log('🔍 Auth test - isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
  console.log('🔍 Auth test - Headers:', req.headers);
  console.log('🔍 Auth test - Cookies:', req.headers.cookie);
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: req.user,
      session: req.session,
      sessionID: req.sessionID
    });
  } else {
    res.json({ 
      authenticated: false,
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      user: req.user,
      session: req.session,
      headers: req.headers,
      cookies: req.headers.cookie
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO for production
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000, // Increase timeout for better connection stability
});

// Initialize socket handlers
socketHandler(io);

// Error handling middleware
app.use(errorHandler);

// Root route
app.get('/', (req, res) => {
  res.send('Nevexa API is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Session test endpoint
app.get('/api/session-test', (req, res) => {
  console.log('🧪 Session test - Headers:', req.headers);
  console.log('🧪 Session test - Session ID:', req.sessionID);
  console.log('🧪 Session test - Session:', req.session);
  
  // Initialize session counter if it doesn't exist
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  
  res.json({
    sessionID: req.sessionID,
    views: req.session.views,
    session: req.session,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent'],
    environment: process.env.NODE_ENV,
    isProduction: isProduction,
    actuallyProduction: actuallyProduction
  });
});

// Cookie test endpoint
app.get('/api/cookie-test', (req, res) => {
  console.log('🍪 Cookie test - User Agent:', req.headers['user-agent']);
  console.log('🍪 Cookie test - Is Mobile:', req.isMobile);
  console.log('🍪 Cookie test - Received Cookies:', req.headers.cookie);
  console.log('🍪 Cookie test - Origin:', req.headers.origin);
  
  // Set multiple test cookies with different configurations
  res.cookie('test-cookie-lax', 'test-value-lax', {
    httpOnly: true,
    secure: actuallyProduction,
    sameSite: 'lax',
    maxAge: 60000 // 1 minute
  });
  
  res.cookie('test-cookie-none', 'test-value-none', {
    httpOnly: true,
    secure: actuallyProduction,
    sameSite: 'none',
    maxAge: 60000 // 1 minute
  });
  
  res.cookie('test-cookie-strict', 'test-value-strict', {
    httpOnly: true,
    secure: actuallyProduction,
    sameSite: 'strict',
    maxAge: 60000 // 1 minute
  });
  
  res.json({
    message: 'Test cookies set with different sameSite values',
    receivedCookies: req.headers.cookie,
    environment: process.env.NODE_ENV,
    isMobile: req.isMobile,
    actuallyProduction: actuallyProduction,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    cookiesSet: [
      { name: 'test-cookie-lax', sameSite: 'lax' },
      { name: 'test-cookie-none', sameSite: 'none' },
      { name: 'test-cookie-strict', sameSite: 'strict' }
    ]
  });
});

// Clear all cookies endpoint
app.get('/api/clear-cookies', (req, res) => {
  // Clear all possible session cookies with different configurations
  res.clearCookie('connect.sid');
  res.clearCookie('connect.sid', { path: '/' });
  res.clearCookie('connect.sid', { path: '/', domain: undefined });
  res.clearCookie('nevexa.session');
  res.clearCookie('test-cookie');
  res.clearCookie('test-cookie-lax');
  res.clearCookie('test-cookie-none');
  res.clearCookie('test-cookie-strict');
  
  // Also destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.json({
      message: 'All cookies cleared and session destroyed',
      clearedCookies: ['connect.sid', 'nevexa.session', 'test-cookie', 'test-cookie-lax', 'test-cookie-none', 'test-cookie-strict']
    });
  });
});

// Mobile cookie debugging endpoint
app.get('/api/mobile-debug', (req, res) => {
  console.log('📱 Mobile Debug - Full Analysis');
  console.log('📱 User Agent:', req.headers['user-agent']);
  console.log('📱 Is Mobile:', req.isMobile);
  console.log('📱 Origin:', req.headers.origin);
  console.log('📱 Referer:', req.headers.referer);
  console.log('📱 All Headers:', req.headers);
  console.log('📱 Session ID:', req.sessionID);
  console.log('📱 Session:', JSON.stringify(req.session, null, 2));
  console.log('📱 Cookies Received:', req.headers.cookie);
  
  // Set a test session value
  if (!req.session.testValue) {
    req.session.testValue = 'mobile-test-' + Date.now();
  }
  
  res.json({
    message: 'Mobile debugging info',
    isMobile: req.isMobile,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    sessionID: req.sessionID,
    session: req.session,
    cookiesReceived: req.headers.cookie,
    testValue: req.session.testValue,
    environment: process.env.NODE_ENV,
    actuallyProduction: actuallyProduction,
    cookieSettings: {
      sameSite: req.session.cookie.sameSite,
      secure: req.session.cookie.secure,
      httpOnly: req.session.cookie.httpOnly,
      maxAge: req.session.cookie.maxAge
    }
  });
});

// Debug authentication endpoint
app.get('/api/debug-auth', async (req, res) => {
  console.log('🔍 Debug Auth - Full Request Analysis');
  console.log('🔍 Session ID:', req.sessionID);
  console.log('🔍 Session:', JSON.stringify(req.session, null, 2));
  console.log('🔍 req.user:', req.user);
  console.log('🔍 req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
  console.log('🔍 Cookies:', req.headers.cookie);
  
  // Check if user exists in database
  let userInDB = null;
  if (req.session?.passport?.user) {
    try {
      userInDB = await User.findOne({ email: req.session.passport.user });
      console.log('🔍 User found in DB:', !!userInDB);
    } catch (error) {
      console.log('🔍 Error finding user in DB:', error.message);
    }
  }
  
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    user: req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    cookies: req.headers.cookie,
    passportUser: req.session?.passport?.user,
    userExistsInDB: !!userInDB,
    userFromDB: userInDB ? { email: userInDB.email, name: userInDB.name } : null,
    analysis: {
      hasSession: !!req.session,
      hasPassportData: !!(req.session?.passport),
      hasUser: !!req.user,
      hasIsAuthenticatedFunction: !!req.isAuthenticated,
      passportUserMatches: req.session?.passport?.user === req.user?.email
    }
  });
});

// Session refresh endpoint for mobile clients
app.post('/api/session/refresh', (req, res) => {
  console.log('🔄 Session refresh requested');
  console.log('🔄 Is Mobile:', req.isMobile);
  console.log('🔄 Session ID:', req.sessionID);
  console.log('🔄 User authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Extend session for authenticated users
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    req.session.touch();
    
    res.json({
      success: true,
      message: 'Session refreshed successfully',
      sessionID: req.sessionID,
      expiresAt: new Date(Date.now() + req.session.cookie.maxAge),
      isMobile: req.isMobile
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated - cannot refresh session',
      sessionID: req.sessionID
    });
  }
});

// Test endpoint to bypass auth and get user directly
app.get('/api/test-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .select('-hash -salt')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'User found (bypassing auth)',
      user: user 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database error',
      details: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running in ${actuallyProduction ? 'production' : 'development'} mode on port ${PORT}`);
  console.log(`🔧 Actual mode: ${actuallyProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🍪 Cookies will be: ${actuallyProduction ? 'secure with sameSite=none' : 'non-secure with sameSite=lax'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Don't crash the server in production, but log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // In production, you might want to gracefully shut down and restart
  // process.exit(1);
});

module.exports = app;