const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Create a comment
router.post('/', isAuthenticated, commentController.createComment);

// Get all comments for a post
router.get('/post/:postId', commentController.getCommentsByPost);

// Update a comment
router.put('/:id', isAuthenticated, commentController.updateComment);

// Delete a comment
router.delete('/:id', isAuthenticated, commentController.deleteComment);

module.exports = router; 