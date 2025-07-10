// models/chat.model.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chat", chatSchema);
