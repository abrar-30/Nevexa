// Minimal test server to isolate the path-to-regexp error
const express = require('express');
const cors = require('cors');

const app = express();

// Basic CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://nevexa.vercel.app'],
  credentials: true
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Test auth route
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    message: 'Test login endpoint',
    user: { id: '123', name: 'Test User' },
    token: 'test-token'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

module.exports = app;
