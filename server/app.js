const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { socketHandler } = require('./sockets/index');
const connectDB = require('./db/connect');
const passport = require('passport');
const User = require('./models/user.model');
const errorHandler = require('./middleware/error.middleware');
const session = require('express-session');

const app = express();

if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MongoDB URI not found. Running without database connection.');
}

app.use(cors({
  origin: 'http://localhost:3000', // or your frontend's actual URL
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/test', express.static(path.join(__dirname, 'test')));


app.use(session({
  secret: 'replace-with-a-strong-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
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
app.use('/api/users', (req, res, next) => {
  req._isAuthenticated = isAuthenticated;
  next();
}, userRoutes);
app.use('/api/comments', commentRoutes);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
socketHandler(io);
app.use(errorHandler);
app.get('/', (req, res) => {
  res.send('API is running');
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 