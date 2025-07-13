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

// Ensure required environment variables are set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET environment variable is required');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

// Enable compression for all responses
app.use(compression());

// Configure CORS for production
const allowedOrigins = [
  'https://nevexa.vercel.app',
  'https://nevexa-git-main-abrar-30s-projects.vercel.app'
  // Add any other production domains here
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day in seconds
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'none', // Required for cross-site cookies
    secure: true, // Always use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Cross-origin cookie handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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