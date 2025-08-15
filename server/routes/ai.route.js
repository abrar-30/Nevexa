const express = require('express');
const multer = require('multer');
const aiService = require('../services/ai.service');
const passport = require('passport');

const router = express.Router();

// Configure multer for handling image uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files for AI analysis
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for AI analysis'), false);
    }
  }
});

/**
 * POST /api/ai/suggest-caption
 * Generate caption suggestions based on text and optional image
 */
router.post('/suggest-caption', 
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req, res) => {
    try {
      const { currentText = '' } = req.body;
      let imageBase64 = null;
      let imageType = null;

      // Process uploaded image if present
      if (req.file) {
        imageBase64 = aiService.imageToBase64(req.file.buffer);
        imageType = req.file.mimetype;
      }

      // Generate caption suggestion
      const suggestion = await aiService.generateCaptionSuggestion(
        currentText,
        imageBase64,
        imageType
      );

      res.json({
        success: true,
        suggestion,
        hasImage: !!req.file
      });

    } catch (error) {
      console.error('Caption suggestion error:', error);
      
      let errorMessage = 'Failed to generate caption suggestion';
      let statusCode = 500;

      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error';
        statusCode = 503;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'AI service temporarily unavailable';
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      // Test with a simple prompt
      const testSuggestion = await aiService.generateCaptionSuggestion('Hello');
      
      res.json({
        success: true,
        status: 'healthy',
        message: 'AI service is operational'
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: 'AI service is not responding'
      });
    }
  }
);

module.exports = router;