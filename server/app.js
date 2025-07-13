// .env should define MONGODB_URI, SESSION_SECRET, and NODE_ENV
// For local dev, create a .env file with:
// MONGODB_URI=mongodb://localhost:27017/yourdbname
// SESSION_SECRET=your-local-secret
// NODE_ENV=development
// For production, set these as environment variables securely.

const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression'); // Add compression
const { Server } = require('socket.io');
const { socketHandler } = require('./sockets/index');
const connectDB = require('./db/connect');
const passport = require('passport');
const User = require('./models/user.model');
const errorHandler = require('./middleware/error.middleware');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

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
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use('/test', express.static(path.join(__dirname, 'test')));


app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret', // Use env var, fallback for local dev
  resave: false,
  saveUninitialized: false,
  proxy: true,
  rolling: true, // Reset expiration on each request - important for mobile
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds (longer for mobile)
    touchAfter: 60 * 60 // Update session every hour instead of daily
  }),
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use 'none' for cross-domain in production
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production only
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (longer for mobile users)
  }
}));


// Mobile detection and session handling middleware
app.use((req, res, next) => {
  // Detect mobile browsers
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Add mobile flag to request
  req.isMobile = isMobile;
  
  // For mobile browsers, extend session on each authenticated request
  if (isMobile && req.isAuthenticated && req.isAuthenticated() && req.session) {
    // Reset session expiration for mobile users on each request
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    req.session.touch(); // Update session timestamp
  }
  
  next();
});

// Debug middleware to check session and cookies
app.use((req, res, next) => {
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Session ID:', req.sessionID);
  console.log('🔍 Is Mobile:', req.isMobile);
  console.log('🔍 Session exists:', !!req.session);
  console.log('🔍 User authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  console.log('🔍 Cookies:', req.headers.cookie);
  console.log('🔍 Origin:', req.headers.origin);
  console.log('---');
  next();
});

// Additional middleware for cross-origin cookie handling
app.use((req, res, next) => {
  // Set additional headers for cross-origin requests
  if (process.env.NODE_ENV === 'production') {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const { isAuthenticated: origIsAuthenticated } = require('./middleware/auth.middleware');
const isAuthenticated = (req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  return origIsAuthenticated(req, res, next);
};


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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 