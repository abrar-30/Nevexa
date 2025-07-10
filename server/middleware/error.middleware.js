const multer = require('multer');

// Error handling middleware for multer and other errors
const errorHandler = (error, req, res, next) => {
  console.error('❌ Error occurred:', error);

  // Handle multer errors
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  // Handle file type errors
  if (error.message && error.message.includes('File type')) {
    console.error('❌ File type error:', error.message);
    return res.status(400).json({ error: error.message });
  }
  
  // Handle Cloudinary video upload errors
  if (error.message && error.message.includes('Unsupported codec')) {
    console.error('❌ Cloudinary video error:', error.message);
    return res.status(400).json({ 
      error: 'Video format not supported. Please try a different video file or convert to MP4 format.' 
    });
  }
  
  // Handle other Cloudinary errors
  if (error.http_code) {
    console.error('❌ Cloudinary error:', error.message);
    return res.status(400).json({ 
      error: `Upload failed: ${error.message}` 
    });
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    console.error('❌ Validation error:', error.message);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.message 
    });
  }
  
  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    console.error('❌ MongoDB error:', error.message);
    return res.status(500).json({ 
      error: 'Database error occurred' 
    });
  }
  
  // Handle general errors
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler; 