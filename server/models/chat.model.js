// models/chat.model.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastRead: { type: Date, default: null }
    }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chat", chatSchema);
