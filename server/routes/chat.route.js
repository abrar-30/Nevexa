
const express = require("express");
const { getMessages, sendMessage, getConversations } = require("../controllers/chat.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");
const router = express.Router();

// GET /api/chat/messages?user1=...&user2=...
router.get("/messages", getMessages);        // GET messages between two users (query params)
router.post("/", sendMessage);              // POST a new message

// GET /api/chat/conversations
router.get("/conversations", isAuthenticated, getConversations);

module.exports = router;
