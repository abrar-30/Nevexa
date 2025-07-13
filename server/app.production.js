// Production-ready server configuration
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
const corsConfig = require('./cors.fix');

// Initialize Express app
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.error('❌ MongoDB URI not found. Exiting.');
  process.exit(1);
}

// Ensure session secret is set
if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET not set. Exiting.');
  process.exit(1);
}

// Add compression middleware for better performance
app.use(compression());

// Configure CORS with our custom settings
app.use(cors(corsConfig.corsOptions()));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Important for proxied environments like Render
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: corsConfig.cookieConfig(isProduction)
}));

// Additional headers for cross-origin cookie handling
app.use((req, res, next) => {
  if (isProduction) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
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

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, corsConfig.socketOptions());
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
  console.log(`✅ Server running in ${isProduction ? 'production' : 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

module.exports = app;