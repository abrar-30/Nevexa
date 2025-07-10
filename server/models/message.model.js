// models/message.model.js

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

module.exports = mongoose.model("Message", messageSchema);
