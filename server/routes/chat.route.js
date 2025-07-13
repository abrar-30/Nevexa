
const express = require("express");
const { getMessages, sendMessage, getConversations, markConversationAsRead } = require("../controllers/chat.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");
const router = express.Router();

// GET /api/chat/messages?user1=...&user2=...
router.get("/messages", isAuthenticated, getMessages);        // GET messages between two users (query params)
router.post("/", isAuthenticated, sendMessage);              // POST a new message

// GET /api/chat/conversations
router.get("/conversations", isAuthenticated, getConversations);

// PATCH /api/chat/conversations/:conversationId/read
router.patch("/conversations/:conversationId/read", isAuthenticated, markConversationAsRead);

module.exports = router;
