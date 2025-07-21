const Message = require("../models/message.model");
const User = require("../models/user.model");
const Chat = require("../models/chat.model");
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

// Mark conversation as read for current user
const markConversationAsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Find or create chat for this conversation
    let chat = await Chat.findOne({
      participants: { $all: [conversationId, currentUserId] }
    });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        participants: [
          { user: currentUserId, lastRead: new Date() },
          { user: conversationId, lastRead: null }
        ]
      });
    } else {
      // Update current user's lastRead
      const participantIndex = chat.participants.findIndex(
        p => p.user.toString() === currentUserId.toString()
      );
      
      if (participantIndex !== -1) {
        chat.participants[participantIndex].lastRead = new Date();
      } else {
        // Add current user to participants if not present
        chat.participants.push({ user: currentUserId, lastRead: new Date() });
      }
    }

    await chat.save();
    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (err) {
    console.error('Mark conversation as read error:', err);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
};

// Get unread count for a conversation
const getUnreadCount = async (currentUserId, otherUserId) => {
  try {
    // Find the chat
    const chat = await Chat.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    });

    if (!chat) {
      // If no chat exists, count all messages from other user
      const count = await Message.countDocuments({
        sender: otherUserId,
        receiver: currentUserId
      });
      return count;
    }

    // Find current user's lastRead
    const currentUserParticipant = chat.participants.find(
      p => p.user.toString() === currentUserId.toString()
    );

    if (!currentUserParticipant || !currentUserParticipant.lastRead) {
      // If no lastRead, count all messages from other user
      const count = await Message.countDocuments({
        sender: otherUserId,
        receiver: currentUserId
      });
      return count;
    }

    // Count messages sent after lastRead
    const count = await Message.countDocuments({
      sender: otherUserId,
      receiver: currentUserId,
      createdAt: { $gt: currentUserParticipant.lastRead }
    });

    return count;
  } catch (err) {
    console.error('Get unread count error:', err);
    return 0;
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

    // For each participant, get user info, all messages, and unread count
    const conversations = await Promise.all(participants.map(async (p) => {
      const user = await User.findById(new mongoose.Types.ObjectId(p._id)).select("_id name avatar");
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: p._id },
          { sender: p._id, receiver: userId }
        ]
      }).sort({ createdAt: 1 });
      
      // Get unread count
      const unreadCount = await getUnreadCount(userId, p._id);
      
      return {
        id: p._id,
        user: user ? { id: user._id, name: user.name, avatar: user.avatar } : null,
        lastMessage: {
          content: p.lastMessage.content,
          timestamp: p.lastMessage.createdAt,
          senderId: p.lastMessage.sender
        },
        unreadCount,
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

// Get total unread count for current user
const getTotalUnreadCount = async (req, res) => {
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
        $group: {
          _id: "$otherUser"
        }
      }
    ]);

    // Calculate total unread count across all conversations
    let totalUnread = 0;
    for (const participant of participants) {
      const unreadCount = await getUnreadCount(userId, participant._id);
      totalUnread += unreadCount;
    }

    res.json({ unreadCount: totalUnread });
  } catch (err) {
    console.error('Get total unread count error:', err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getConversations,
  markConversationAsRead,
  getTotalUnreadCount
};
