// .env should define MONGODB_URI, JWT_SECRET, and NODE_ENV
// For local dev, create a .env file with:
// MONGODB_URI=mongodb://localhost:27017/yourdbname
// JWT_SECRET=your-local-jwt-secret
// NODE_ENV=development
// For production, set these as environment variables securely.

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

if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MongoDB URI not found. Running without database connection.');
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
app.use(passport.initialize());

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