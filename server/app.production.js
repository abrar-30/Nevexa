// Production-ready server configuration for Render and general production
// Unified session management for all devices (no mobile-specific logic)

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

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isRenderDeployment = process.env.RENDER || process.env.RENDER_SERVICE_ID;
const forceProduction = isRenderDeployment || process.env.FORCE_PRODUCTION === 'true';
const actuallyProduction = isProduction || forceProduction;

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

app.use(compression());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nevexa.vercel.app',
  'https://nevexa-git-main-abrar-30s-projects.vercel.app',
  'https://nevexa-abrar-30s-projects.vercel.app',
  /^https:\/\/nevexa-.*\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    if (isAllowed) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS not allowed for ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '10mb' }));

// Unified session management for all devices
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  rolling: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60,
    touchAfter: 60 * 60
  }),
  cookie: {
    httpOnly: true,
    sameSite: actuallyProduction ? 'none' : 'lax', // Use 'none' for cross-domain in production
    secure: actuallyProduction, // Must be true for 'none' sameSite
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: undefined,
    path: '/'
  }
}));

// Debug middleware for session/cookie info (optional, can be removed in final prod)
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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  
  // Additional headers for cross-domain cookies
  if (actuallyProduction) {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://nevexa.vercel.app');
  }
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
});

// Authentication setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
  done(null, user.email);
});
passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (error) {
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

// Cookie test endpoint for cross-domain debugging
app.get('/api/cookie-test', (req, res) => {
  // Set a test cookie
  res.cookie('test-cookie', 'test-value-' + Date.now(), {
    httpOnly: true,
    secure: actuallyProduction,
    sameSite: actuallyProduction ? 'none' : 'lax',
    maxAge: 60000 // 1 minute
  });
  
  res.json({
    message: 'Test cookie set',
    receivedCookies: req.headers.cookie,
    environment: process.env.NODE_ENV,
    actuallyProduction: actuallyProduction,
    origin: req.headers.origin,
    cookieSettings: {
      sameSite: actuallyProduction ? 'none' : 'lax',
      secure: actuallyProduction,
      httpOnly: true
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000,
});
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running in ${actuallyProduction ? 'production' : 'development'} mode on port ${PORT}`);
  console.log(`🔧 Actual mode: ${actuallyProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🍪 Cookies will be: ${actuallyProduction ? 'secure with sameSite=none' : 'non-secure with sameSite=lax'}`);
});

module.exports = app;