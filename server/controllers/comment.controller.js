const Comment = require('../models/comment.model');
const Post = require('../models/post.model');

// Create a comment
exports.createComment = async (req, res) => {
  try {
    const { content, post } = req.body;
    if (!content || !post) {
      return res.status(400).json({ error: 'Content and post are required.' });
    }
    const comment = new Comment({
      content,
      user: req.user._id,
      post
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all comments for a post
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a comment (only by owner)
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update your own comments.' });
    }
    comment.content = content;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a comment (only by owner)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 