import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSocket } from "../utils/socket";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch all users on mount
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user, fetchUsers]);

  // Set up socket listeners
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    // Receive new message
    socket.on("message:receive", (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // Track unread count if not currently chatting with this sender
      setUnreadCounts((prev) => {
        const senderId = message.sender._id || message.sender;
        if (selectedUser?._id !== senderId) {
          return { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
        }
        return prev;
      });
    });

    // Message sent confirmation (update temp message with real one)
    socket.on("message:sent", (message) => {
      setMessages((prev) => {
        // Replace temp message or add if not found
        const exists = prev.find((m) => m._id === message._id);
        if (exists) return prev.map((m) => (m._id === message._id ? message : m));
        return [...prev, message];
      });
    });

    // Online users update
    socket.on("users:online", (userIds) => {
      setOnlineUsers(userIds);
    });

    // Typing indicators
    socket.on("typing:start", ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
    });

    socket.on("typing:stop", ({ senderId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[senderId];
        return updated;
      });
    });

    // Messages seen notification
    socket.on("messages:seen", ({ receiverId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver?._id === receiverId || m.receiver === receiverId
            ? { ...m, status: "seen" }
            : m
        )
      );
    });

    return () => {
      socket.off("message:receive");
      socket.off("message:sent");
      socket.off("users:online");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("messages:seen");
    };
  }, [user, selectedUser]);

  // Load conversation when user is selected
  const loadConversation = useCallback(async (otherUser) => {
    setSelectedUser(otherUser);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/${otherUser._id}`);
      setMessages(data);

      // Clear unread count for this user
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        delete updated[otherUser._id];
        return updated;
      });

      // Mark messages as seen
      const socket = getSocket();
      socket.emit("messages:seen", {
        senderId: otherUser._id,
        receiverId: user._id,
      });
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  // Send a text message
  const sendMessage = useCallback(
    (content) => {
      if (!selectedUser || !content.trim()) return;
      const socket = getSocket();
      socket.emit("message:send", {
        senderId: user._id,
        receiverId: selectedUser._id,
        content: content.trim(),
        type: "text",
      });
    },
    [user, selectedUser]
  );

  // Send an image message
  const sendImageMessage = useCallback(
    (imageUrl) => {
      if (!selectedUser) return;
      const socket = getSocket();
      socket.emit("message:send", {
        senderId: user._id,
        receiverId: selectedUser._id,
        content: "",
        type: "image",
        imageUrl,
      });
    },
    [user, selectedUser]
  );

  const isOnline = (userId) => onlineUsers.includes(userId?.toString());
  const isTyping = (userId) => !!typingUsers[userId];

  return (
    <ChatContext.Provider
      value={{
        selectedUser,
        setSelectedUser: loadConversation,
        messages,
        users,
        onlineUsers,
        typingUsers,
        loadingMessages,
        unreadCounts,
        sendMessage,
        sendImageMessage,
        fetchUsers,
        isOnline,
        isTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
