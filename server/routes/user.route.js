const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const postController = require('../controllers/post.controller');
const { upload } = require('../middleware/cloudinary.middleware');
const passport = require('passport');


// Specific routes must come before parameterized routes
router.get('/me', passport.authenticate('jwt', { session: false }), userController.getMe);
// GET /api/users/search?q=...
router.get("/search", passport.authenticate('jwt', { session: false }), userController.searchUsers);
router.get('/', userController.getAllUsers);

// Parameterized routes
router.get('/:id', passport.authenticate('jwt', { session: false }), userController.getUserById);
router.put('/:id', passport.authenticate('jwt', { session: false }), userController.updateUser);
router.patch('/:id/follow', passport.authenticate('jwt', { session: false }), userController.followUser);
router.patch('/:id/unfollow', passport.authenticate('jwt', { session: false }), userController.unfollowUser);

// Avatar upload endpoint
router.post('/:id/avatar', passport.authenticate('jwt', { session: false }), upload.single('avatar'), userController.uploadAvatar);

// User posts
router.get('/:id/posts', postController.getPostsByUser);

module.exports = router; 