
const express = require("express");
const { getMessages, sendMessage } = require("../controllers/chat.controller");
const router = express.Router();

// GET /api/chat/messages?user1=...&user2=...
router.get("/messages", getMessages);        // GET messages between two users (query params)
router.post("/", sendMessage);              // POST a new message

module.exports = router;
