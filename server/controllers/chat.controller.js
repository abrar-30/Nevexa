const Message = require("../models/message.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

// Fetch chat history between two users
const getMessages = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 are required' });
    }
    
    // Ensure the current user is one of the participants
    const currentUserId = req.user._id.toString();
    if (currentUserId !== user1 && currentUserId !== user2) {
      return res.status(403).json({ error: 'You can only view your own conversations' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 }); // oldest first
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const sender = req.user._id;
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const message = await Message.create({ sender, receiver, content });

    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = String(req.user._id);

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
        $addFields: {
          otherUser: {
            $cond: [
              { $eq: ["$sender", userId] }, 
              "$receiver", 
              "$sender"
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    // For each participant, get user info and all messages
    const conversations = await Promise.all(participants.map(async (p) => {
      const user = await User.findById(new mongoose.Types.ObjectId(p._id)).select("_id name avatar");
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
    console.error('Get conversations error:', err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getConversations
};
