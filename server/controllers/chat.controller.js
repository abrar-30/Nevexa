const Message = require("../models/message.model");
const User = require("../models/user.model");

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

// Get all conversations for the current user
const getConversations = async (req, res) => {
  const userId = req.user._id.toString();
  const Message = require("../models/message.model");
  const User = require("../models/user.model");

  try {
    // Find all users this user has messaged or received messages from
    const participants = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $project: {
          otherUser: {
            $cond: [
              { $eq: ["$sender", userId] }, "$receiver", "$sender"
            ]
          },
          content: 1,
          sender: 1,
          receiver: 1,
          createdAt: 1
        }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $last: "$$ROOT" }
        }
      }
    ]);

    // For each participant, get user info and all messages
    const conversations = await Promise.all(participants.map(async (p) => {
      const user = await User.findById(p._id).select("_id name avatar");
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: p._id },
          { sender: p._id, receiver: userId }
        ]
      }).sort({ createdAt: 1 });
      return {
        id: p._id,
        user: user ? { id: user._id, name: user.name, avatar: user.avatar } : null,
        lastMessage: {
          content: p.lastMessage.content,
          timestamp: p.lastMessage.createdAt,
          senderId: p.lastMessage.sender
        },
        messages: messages.map(m => ({
          id: m._id,
          content: m.content,
          senderId: m.sender,
          timestamp: m.createdAt,
          read: true // or implement read status if needed
        }))
      };
    }));

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getConversations
};
