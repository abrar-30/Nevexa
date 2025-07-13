// CORS configuration for production
const corsConfig = {
  // Update this list with all your frontend domains
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nevexa.vercel.app',
    'https://nevexa-git-main-abrar-30s-projects.vercel.app'
  ],
  
  // CORS middleware configuration
  corsOptions: function() {
    return {
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        if (this.allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.log(`❌ Blocked by CORS: ${origin}`);
          return callback(new Error(`CORS not allowed for ${origin}`), false);
        }
      }.bind(this),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie']
    };
  },
  
  // Socket.IO CORS configuration
  socketOptions: function() {
    return {
      cors: {
        origin: this.allowedOrigins,
        credentials: true,
      }
    };
  },
  
  // Session cookie configuration
  cookieConfig: function(isProduction) {
    return {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax', // 'none' is required for cross-site cookies in production
      secure: isProduction, // Must be true when sameSite is 'none'
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };
  }
};

module.exports = corsConfig;