import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

let socket = null;

// Create a single socket instance (singleton pattern)
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // FIX: was `autoConnect: false` — socket never connected, so NO
      // messages were ever received and no events fired. Set to true so
      // the socket connects as soon as it is first created.
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  // Socket is already auto-connecting; just register the user as online.
  // Emit after connection is established (or immediately if already connected).
  if (s.connected) {
    s.emit("user:online", userId);
  } else {
    s.once("connect", () => {
      s.emit("user:online", userId);
    });
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
