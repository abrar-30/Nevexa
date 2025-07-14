const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const passport = require('passport');

// Create a comment
router.post('/', passport.authenticate('jwt', { session: false }), commentController.createComment);

// Get all comments for a post
router.get('/post/:postId', commentController.getCommentsByPost);

// Update a comment
router.put('/:id', passport.authenticate('jwt', { session: false }), commentController.updateComment);

// Delete a comment
router.delete('/:id', passport.authenticate('jwt', { session: false }), commentController.deleteComment);

module.exports = router; 