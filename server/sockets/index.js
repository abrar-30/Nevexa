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
      console.log("[Socket] send-message received:", { sender, receiver, content });
      // Save to DB
      try {
        console.log("[Socket] Saving message to DB...");
        const msg = await Message.create({
          sender,
          receiver,
          content
        });
        console.log("[Socket] Message saved:", msg);
        // Emit to receiver
        io.to(String(receiver)).emit("receive-message", {
          sender,
          content,
          timestamp: msg.createdAt,
          _id: msg._id
        });
        // Emit to sender as well
        io.to(String(sender)).emit("receive-message", {
          sender,
          content,
          timestamp: msg.createdAt,
          _id: msg._id
        });
        console.log(`[Socket] Emitted receive-message to receiver room: ${receiver} and sender room: ${sender}`);
      } catch (err) {
        console.error("[Socket] Failed to save message:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = { socketHandler };
