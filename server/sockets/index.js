// sockets/index.js
const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join room for personal messaging
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Handle sending messages
    const Message = require('../models/message.model');
    socket.on("send-message", async ({ sender, receiver, content }) => {
      // Save to DB
      try {
        const msg = await Message.create({
          sender,
          receiver,
          content
        });
        // Optionally, you can emit the saved message (with _id, etc.)
        io.to(receiver).emit("receive-message", {
          sender,
          content,
          timestamp: msg.createdAt, // Use createdAt
          _id: msg._id
        });
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = { socketHandler };
