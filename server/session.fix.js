// Direct session fix for cross-domain authentication
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

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MongoDB URI not found. Running without database connection.');
}

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET not set. Using fallback. Set SESSION_SECRET in your .env for security.');
}

// Add compression middleware for better performance
app.use(compression());

// CORS configuration - CRITICAL for cross-domain cookies
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nevexa.vercel.app',
  'https://nevexa-git-main-abrar-30s-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/test', express.static(path.join(__dirname, 'test')));

// Session configuration - FIXED for cross-domain
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Important for proxied environments
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'none', // CHANGED from 'lax' to 'none' for cross-domain
    secure: true,     // MUST be true when sameSite is 'none'
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Debug middleware to check session and cookies
app.use((req, res, next) => {
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Session ID:', req.sessionID);
  console.log('🔍 Session data:', req.session);
  console.log('🔍 User authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  console.log('🔍 Cookies:', req.headers.cookie);
  console.log('🔍 Origin:', req.headers.origin);
  console.log('---');
  next();
});

// Additional middleware for cross-origin cookie handling
app.use((req, res, next) => {
  // ALWAYS set these headers for cross-domain cookies
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
socketHandler(io);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('API is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication test endpoint
app.get('/api/auth-test', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: req.user,
      session: req.session
    });
  } else {
    res.json({ 
      authenticated: false,
      sessionExists: !!req.session,
      sessionID: req.sessionID
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;