const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const postController = require('../controllers/post.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/cloudinary.middleware');


// Specific routes must come before parameterized routes
router.get('/me', isAuthenticated, userController.getMe);
// GET /api/users/search?q=...
router.get("/search", isAuthenticated, userController.searchUsers);
router.get('/', userController.getAllUsers);

// Parameterized routes
router.get('/:id', isAuthenticated, userController.getUserById);
router.put('/:id', isAuthenticated, userController.updateUser);
router.patch('/:id/follow', isAuthenticated, userController.followUser);
router.patch('/:id/unfollow', isAuthenticated, userController.unfollowUser);

// Avatar upload endpoint
router.post('/:id/avatar', isAuthenticated, upload.single('avatar'), userController.uploadAvatar);

// User posts
router.get('/:id/posts', postController.getPostsByUser);

module.exports = router; 