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

// Add compression middleware for better performance
app.use(compression());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Support both ports
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use('/test', express.static(path.join(__dirname, 'test')));


app.use(session({
  secret: 'replace-with-a-strong-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  }
}));


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