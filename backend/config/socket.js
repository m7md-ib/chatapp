const Message = require("../models/Message");

// Map: userId -> socketId (for routing messages to the right socket)
const onlineUsers = new Map();

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online — register their socket
    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
      // Broadcast updated online users list to everyone
      io.emit("users:online", Array.from(onlineUsers.keys()));
      console.log(`👤 User online: ${userId} (${onlineUsers.size} total)`);
    });

    // Handle sending a message
    socket.on("message:send", async (data) => {
      try {
        const { senderId, receiverId, content, type, imageUrl } = data;

        // Persist message to DB
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content: content || "",
          type: type || "text",
          imageUrl: imageUrl || null,
          status: "sent",
        });

        const populatedMessage = await message.populate([
          { path: "sender", select: "name avatar" },
          { path: "receiver", select: "name avatar" },
        ]);

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message:receive", populatedMessage);

          // Auto-mark as delivered since receiver is online
          await Message.findByIdAndUpdate(message._id, { status: "delivered" });
          populatedMessage.status = "delivered";
        }

        // Confirm back to sender with final message object
        socket.emit("message:sent", populatedMessage);
      } catch (error) {
        console.error("Error handling message:send:", error);
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing:start", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { senderId });
      }
    });

    socket.on("typing:stop", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:stop", { senderId });
      }
    });

    // Mark messages as seen
    socket.on("messages:seen", async ({ senderId, receiverId }) => {
      try {
        // Mark all messages from sender to receiver as seen
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, status: { $ne: "seen" } },
          { status: "seen" }
        );

        // Notify sender that their messages were seen
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages:seen", { receiverId });
        }
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Find and remove the disconnected user
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("users:online", Array.from(onlineUsers.keys()));
          console.log(`👤 User offline: ${userId}`);
          break;
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket, onlineUsers };
