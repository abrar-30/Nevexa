const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { upload } = require('../middleware/cloudinary.middleware');
const { isAuthenticated } = require('../middleware/auth.middleware');

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
router.patch('/:id/like', isAuthenticated, postController.likePost);
// Unlike a post
router.patch('/:id/unlike', isAuthenticated, postController.unlikePost);

// // Report a post
// router.post('/:postId/report', isAuthenticated, postController.reportPost);


module.exports = router; 