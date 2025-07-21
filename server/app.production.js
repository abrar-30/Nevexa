// Production-ready server configuration for Render and general production
// JWT-based authentication only, no cookies or sessions

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
const errorHandler = require('./middleware/error.middleware');
const passport = require('passport');
const User = require('./models/user.model');
require('./middleware/passport-jwt')(passport);

// Set up local strategy for login/register
passport.use(User.createStrategy());

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

app.use(compression());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nevexa.vercel.app',
  'https://nevexa-git-main-abrar-30s-projects.vercel.app',
  'https://nevexa-abrar-30s-projects.vercel.app'
];

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin);

    // Allow requests with no origin (mobile apps, curl, etc.)
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
      console.log('CORS allowed for origin:', origin);
      return callback(null, true);
    } else {
      console.error('CORS blocked for origin:', origin);
      return callback(new Error(`CORS not allowed for ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(passport.initialize());

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '10mb' }));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Load routes safely one by one
const loadRoutes = () => {
  try {
    console.log('🔄 Starting route loading...');

    // Load auth routes
    console.log('Loading auth routes...');
    const authRoutes = require('./routes/auth.route');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');

    // Load post routes
    console.log('Loading post routes...');
    const postRoutes = require('./routes/post.route');
    app.use('/api/posts', postRoutes);
    console.log('✅ Post routes loaded');

    // Load chat routes
    console.log('Loading chat routes...');
    const chatRoutes = require('./routes/chat.route');
    app.use('/api/chat', chatRoutes);
    console.log('✅ Chat routes loaded');

    // Load admin routes
    console.log('Loading admin routes...');
    const adminRoutes = require('./routes/admin.route');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded');

    // Load report routes
    console.log('Loading report routes...');
    const reportRoutes = require('./routes/report.route');
    app.use('/api/reports', reportRoutes);
    console.log('✅ Report routes loaded');

    // Load user routes
    console.log('Loading user routes...');
    const userRoutes = require('./routes/user.route');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded');

    // Load comment routes
    console.log('Loading comment routes...');
    const commentRoutes = require('./routes/comment.route');
    app.use('/api/comments', commentRoutes);
    console.log('✅ Comment routes loaded');

    console.log('🎉 All routes loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading routes:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Load routes
if (!loadRoutes()) {
  console.error('❌ Failed to load routes, exiting...');
  process.exit(1);
}

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
});

module.exports = app;