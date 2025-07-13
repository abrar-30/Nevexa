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

// Session configuration with MongoDB store
app.use(session({
  name: 'nevexa.session', // Explicit session name
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Important for proxied environments like Render
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day in seconds
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    httpOnly: true,
    sameSite: actuallyProduction ? 'none' : 'lax', // Use 'none' only in production
    secure: actuallyProduction, // Only secure in production
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    domain: actuallyProduction ? undefined : undefined // Let browser handle domain
  }
}));

// Debug middleware to check session and cookies
app.use((req, res, next) => {
  if (req.url.includes('/api/')) {
    console.log('🔐 Request URL:', req.url);
    console.log('🔐 Session ID:', req.sessionID);
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
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(200);
  }
  
  next();
});

// Authentication setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
  // Set a test cookie
  res.cookie('test-cookie', 'test-value', {
    httpOnly: true,
    secure: actuallyProduction,
    sameSite: actuallyProduction ? 'none' : 'lax',
    maxAge: 60000 // 1 minute
  });
  
  res.json({
    message: 'Test cookie set',
    receivedCookies: req.headers.cookie,
    environment: process.env.NODE_ENV
  });
});

// Clear all cookies endpoint
app.get('/api/clear-cookies', (req, res) => {
  // Clear all possible session cookies
  res.clearCookie('connect.sid');
  res.clearCookie('nevexa.session');
  res.clearCookie('test-cookie');
  
  // Also destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.json({
      message: 'All cookies cleared and session destroyed',
      clearedCookies: ['connect.sid', 'nevexa.session', 'test-cookie']
    });
  });
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