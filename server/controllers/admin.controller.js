const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const Report = require("../models/report.model");


// Reports
exports.getAllReports = async (req, res) => {
  const reports = await Report.find().populate('post reportedBy');
  res.json(reports);
};
exports.getReportById = async (req, res) => {
  const report = await Report.findById(req.params.reportId).populate('post reportedBy');
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
};
exports.resolveReport = async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.reportId, { resolved: true }, { new: true });
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
};
exports.deleteReport = async (req, res) => {
  await Report.findByIdAndDelete(req.params.reportId);
  res.json({ message: 'Report deleted' });
};

// Posts
exports.getAllPosts = async (req, res) => {
  const posts = await Post.find().populate('user comments likes');
  res.json(posts);
};
exports.getPostById = async (req, res) => {
  const post = await Post.findById(req.params.postId).populate('user comments likes');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};
exports.editPost = async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.postId, req.body, { new: true });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};
exports.deletePost = async (req, res) => {
  await Post.findByIdAndDelete(req.params.postId);
  res.json({ message: 'Post deleted' });
};

// Comments
exports.getAllComments = async (req, res) => {
  const comments = await Comment.find().populate('user post');
  res.json(comments);
};
exports.deleteComment = async (req, res) => {
  await Comment.findByIdAndDelete(req.params.commentId);
  res.json({ message: 'Comment deleted' });
};

// Users
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
exports.blockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
exports.unblockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
exports.editUserProfile = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};
