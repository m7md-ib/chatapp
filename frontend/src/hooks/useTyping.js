import { useRef, useCallback } from "react";
import { getSocket } from "../utils/socket";

const TYPING_TIMEOUT = 2000; // Stop typing after 2s of inactivity

const useTyping = (senderId, receiverId) => {
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!senderId || !receiverId) return;
    const socket = getSocket();

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { senderId, receiverId });
    }

    // Reset the debounce timer
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { senderId, receiverId });
    }, TYPING_TIMEOUT);
  }, [senderId, receiverId]);

  const stopTyping = useCallback(() => {
    if (!senderId || !receiverId) return;
    const socket = getSocket();

    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing:stop", { senderId, receiverId });
    }
  }, [senderId, receiverId]);

  return { startTyping, stopTyping };
};

export default useTyping;
