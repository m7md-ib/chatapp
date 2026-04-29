import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import useTyping from "../../hooks/useTyping";
import api from "../../utils/api";

const ChatInput = () => {
  const { user } = useAuth();
  const { sendMessage, sendImageMessage, selectedUser } = useChat();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { startTyping, stopTyping } = useTyping(user?._id, selectedUser?._id);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    stopTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    startTyping();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/messages/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendImageMessage(data.imageUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  return (
    <div className="chat-input-bar">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: "none" }}
      />

      {/* Image upload button */}
      <button
        className="icon-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Send image"
      >
        {uploading ? (
          <span className="spinner spinner-sm" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </button>

      {/* Text input */}
      <textarea
        className="chat-textarea"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
      />

      {/* Send button */}
      <button
        className={`send-btn ${text.trim() ? "active" : ""}`}
        onClick={handleSend}
        disabled={!text.trim()}
        title="Send message"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
