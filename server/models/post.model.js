const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const postSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ content: "text" });

// Note: Cloudinary deletion is now handled in the controller
// This pre-remove hook is kept for backward compatibility but doesn't handle Cloudinary
postSchema.pre("remove", async function (next) {
  try {
    // Cloudinary deletion is handled in the controller
    // This hook only handles local file cleanup if needed
    
    await this.model("Comment").deleteMany({ _id: this.comments });

    await this.model("Report").deleteOne({
      post: this._id,
    });

    await this.model("User").updateMany(
      {
        savedPosts: this._id,
      },
      {
        $pull: {
          savedPosts: this._id,
        },
      }
    );
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Post", postSchema);
