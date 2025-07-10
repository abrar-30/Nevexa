const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary credentials (replace with your actual credentials or use environment variables)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
const apiKey = process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET';

// Check if credentials are properly set
const credentialsSet = cloudName !== 'YOUR_CLOUD_NAME' && 
                      apiKey !== 'YOUR_API_KEY' && 
                      apiSecret !== 'YOUR_API_SECRET';

if (credentialsSet) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️  Cloudinary credentials not found. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  console.log('File uploads and deletions will not work without proper credentials.');
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nevexa_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    resource_type: 'auto', // This allows Cloudinary to automatically detect file type
    // Size limits (in bytes) - 100MB for videos
    max_bytes: 104857600,
    // For videos, let Cloudinary handle the format automatically
    format: 'auto',
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 104857600, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Log file details for debugging
    console.log('📁 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                         'video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/flv', 'video/webm'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Export both upload middleware and cloudinary object
module.exports = {
  upload,
  cloudinary
}; 