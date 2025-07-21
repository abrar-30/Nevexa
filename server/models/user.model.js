const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // Removed password field - managed by passport-local-mongoose
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    avatar: {
      type: String,
    },

    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    location: {
      type: String,
      default: "",
      maxlength: [100, 'Location cannot exceed 100 characters']
    },

    bio: {
      type: String,
      default: "",
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },

    interests: {
      type: String,
      default: "",
      maxlength: [200, 'Interests cannot exceed 200 characters']
    },

    role: {
      type: String,
      enum: ["general","admin"],
      default: "general",
    },

    blocked: {
      type: Boolean,
      default: false,
    },

    savedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    
  },
  { timestamps: true }
);

// Enable text search
userSchema.index({ name: "text", bio: "text" });

// Add passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
