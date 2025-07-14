const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { upload } = require('../middleware/cloudinary.middleware');
const passport = require('passport');

// Get all posts
router.get('/', postController.getAllPosts);

// Get a single post by ID
router.get('/:postId', postController.getPostById);

// Create a new post with file upload
router.post('/', upload.single('file'), postController.createPost);

// Update a post with file upload
router.put('/:postId', upload.single('file'), postController.updatePost);

// Delete a post
router.delete('/:postId', postController.deletePost);

// Like a post
router.patch('/:id/like', passport.authenticate('jwt', { session: false }), postController.likePost);
// Unlike a post
router.patch('/:id/unlike', passport.authenticate('jwt', { session: false }), postController.unlikePost);

// // Report a post
// router.post('/:postId/report', isAuthenticated, postController.reportPost);


module.exports = router; 