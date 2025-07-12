const Post = require('../models/post.model');
const User = require('../models/user.model');
const Comment = require('../models/comment.model');
const { cloudinary } = require('../middleware/cloudinary.middleware');

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email avatar')
      .populate({ path: 'comments', populate: { path: 'user', select: 'name avatar' } });
    res.json({ posts }); // <-- wrap in an object
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name email avatar')
      .populate({ path: 'comments', populate: { path: 'user', select: 'name avatar' } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// Create a new post (with Cloudinary file upload)
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.user ? req.user._id : null;
    const fileUrl = req.file ? req.file.path : null; // Cloudinary URL
    const fileType = req.file ? req.file.mimetype : null;

    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const newPost = await Post.create({
      content,
      fileUrl,
      fileType,
      user
    });
    const populatedPost = await Post.findById(newPost._id).populate('user', 'name email avatar');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create post' });
  }
};

// Update a post (with Cloudinary file upload)
exports.updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Optionally: check if req.user is the post owner or admin
    if (content !== undefined) post.content = content;
    if (req.file) {
      post.fileUrl = req.file.path; // Cloudinary URL
      post.fileType = req.file.mimetype;
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update post' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Optionally: check if req.user is the post owner or admin

    // Delete Cloudinary image if it exists
    if (post.fileUrl) {
      try {
        // Extract public ID from Cloudinary URL
        // Cloudinary URLs are in format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
        const urlParts = post.fileUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          // Get the path after 'upload' and before the file extension
          const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = pathAfterUpload.split('.')[0]; // Remove file extension
          
          // Delete from Cloudinary
          await cloudinary.uploader.destroy(publicId);
          console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error('❌ Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with post deletion even if Cloudinary deletion fails
      }
    }

    // Delete all comments for this post
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne(); // Using deleteOne() instead of remove() (deprecated)
    res.json({ message: 'Post and associated comments deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(400).json({ error: 'Failed to delete post' });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Add user to likes if not already present
    let updated = false;
    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      updated = true;
      await post.save();
    }
    // Also add to post author's likes array
    if (updated) {
      const User = require('../models/user.model');
      const postAuthor = await User.findById(post.user);
      if (postAuthor && !postAuthor.likes.includes(req.user._id)) {
        postAuthor.likes.push(req.user._id);
        await postAuthor.save();
      }
    }
    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (err) {
    res.status(400).json({ error: 'Failed to like post' });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Remove user from likes if present
    const wasLiked = post.likes.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    post.likes = post.likes.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );
    await post.save();
    // Also remove from post author's likes array
    if (wasLiked) {
      const User = require('../models/user.model');
      const postAuthor = await User.findById(post.user);
      if (postAuthor) {
        postAuthor.likes = postAuthor.likes.filter(
          (userId) => userId.toString() !== req.user._id.toString()
        );
        await postAuthor.save();
      }
    }
    res.json({ message: 'Post unliked', likes: post.likes.length });
  } catch (err) {
    res.status(400).json({ error: 'Failed to unlike post' });
  }
};

// Get all posts by a specific user
exports.getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id }).populate('user', 'name email avatar');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
}; 