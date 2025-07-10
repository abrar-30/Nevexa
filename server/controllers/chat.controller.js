const Message = require("../models/message.model");

// Fetch chat history between two users
const getMessages = async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'user1 and user2 are required' });
  }
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 }); // oldest first
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const sendMessage = async (req, res) => {
  const sender = req.user._id;
  const { receiver, content } = req.body;

  const message = await Message.create({ sender, receiver, content });

  // Optionally update chat model here

  res.status(201).json(message);
};

module.exports = {
  getMessages,
  sendMessage
};
