import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getSocket, connectSocket } from "../utils/socket";
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

  // FIX (Bug 2): Keep a ref that always points to the current selectedUser.
  // Socket listeners close over this ref instead of the state value, so they
  // never see a stale selectedUser regardless of when they were registered.
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // ── Fetch all users on mount ───────────────────────────────────────────────
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

  // ── Connect socket & register user:online ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    // FIX (Bug 1): connectSocket was never called. Call it here so the socket
    // actually connects and the server knows this user is online.
    connectSocket(user._id);
  }, [user]);

  // ── Socket event listeners ─────────────────────────────────────────────────
  // FIX (Bug 3): `selectedUser` has been removed from the dependency array.
  // Previously, every time the user clicked a different contact, ALL listeners
  // were torn down and immediately re-added, creating a window where incoming
  // messages were silently dropped. Now listeners are registered once per
  // authenticated session and read `selectedUserRef.current` for the freshest
  // value of selectedUser without needing to re-subscribe.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    // Receive new message
    socket.on("message:receive", (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // FIX (Bug 2): use ref so we always compare against the *current*
      // selected user, not the one captured when this effect first ran.
      setUnreadCounts((prev) => {
        const senderId = message.sender._id || message.sender;
        if (selectedUserRef.current?._id !== senderId) {
          return { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
        }
        return prev;
      });
    });

    // Message sent confirmation — replace temp or append
    socket.on("message:sent", (message) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === message._id);
        if (exists)
          return prev.map((m) => (m._id === message._id ? message : m));
        return [...prev, message];
      });
    });

    // Online users list
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

    // Messages seen
    socket.on("messages:seen", ({ receiverId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver?._id === receiverId || m.receiver === receiverId
            ? { ...m, status: "seen" }
            : m,
        ),
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
  }, [user]); // ← selectedUser intentionally removed; ref handles freshness

  // ── Load conversation when a user is selected ──────────────────────────────
  const loadConversation = useCallback(
    async (otherUser) => {
      setSelectedUser(otherUser);
      selectedUserRef.current = otherUser; // keep ref in sync immediately
      setLoadingMessages(true);
      setMessages([]); // clear previous conversation while loading
      try {
        const { data } = await api.get(`/messages/${otherUser._id}`);
        setMessages(data);

        // Clear unread badge for this user
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[otherUser._id];
          return updated;
        });

        // Tell server messages have been seen
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
    },
    [user],
  );

  // ── Send helpers ───────────────────────────────────────────────────────────
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
    [user, selectedUser],
  );

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
    [user, selectedUser],
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
