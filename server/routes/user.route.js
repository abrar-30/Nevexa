const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const postController = require('../controllers/post.controller');
const { upload } = require('../middleware/cloudinary.middleware');
const { validate, updateUserSchema } = require('../middleware/validate');
const passport = require('passport');

// Optional JWT authentication middleware
const optionalJwtAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    req.user = user || null;
    next();
  })(req, res, next);
};

// User routes


// Specific routes must come before parameterized routes
router.get('/me', passport.authenticate('jwt', { session: false }), userController.getMe);
// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'User routes working' });
});

// GET /api/users/search?q=...
router.get("/search", passport.authenticate('jwt', { session: false }), userController.searchUsers);
// Batch route for fetching multiple users
router.get('/batch', passport.authenticate('jwt', { session: false }), userController.getUsersByIds);
router.get('/', optionalJwtAuth, userController.getAllUsers);

// Parameterized routes - must come after specific routes
router.get('/:id', passport.authenticate('jwt', { session: false }), userController.getUserById);
router.put('/:id', passport.authenticate('jwt', { session: false }), upload.single('avatar'), userController.updateUser);
router.patch('/:id/follow', passport.authenticate('jwt', { session: false }), userController.followUser);
router.patch('/:id/unfollow', passport.authenticate('jwt', { session: false }), userController.unfollowUser);

// Avatar upload endpoint
router.post('/:id/avatar', passport.authenticate('jwt', { session: false }), upload.single('avatar'), userController.uploadAvatar);

// User posts
router.get('/:id/posts', postController.getPostsByUser);

module.exports = router; 