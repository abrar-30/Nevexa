
const express = require("express");
const { getMessages, sendMessage, getConversations, markConversationAsRead } = require("../controllers/chat.controller");
const passport = require('passport');
const router = express.Router();

// GET /api/chat/messages?user1=...&user2=...
router.get("/messages", passport.authenticate('jwt', { session: false }), getMessages);        // GET messages between two users (query params)
router.post("/", passport.authenticate('jwt', { session: false }), sendMessage);              // POST a new message

// GET /api/chat/conversations
router.get("/conversations", passport.authenticate('jwt', { session: false }), getConversations);

// PATCH /api/chat/conversations/:conversationId/read
router.patch("/conversations/:conversationId/read", passport.authenticate('jwt', { session: false }), markConversationAsRead);

module.exports = router;
