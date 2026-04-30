import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { format, isToday, isYesterday } from "date-fns";

const getDateLabel = (date) => {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

// onBack — passed from App.js; called when the ‹ back button is tapped on mobile.
const ChatWindow = ({ onBack }) => {
  const { user } = useAuth();
  const { selectedUser, messages, loadingMessages, isOnline, isTyping } =
    useChat();
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!selectedUser) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">💬</div>
        <h2>Select a conversation</h2>
        <p>Choose a user from the sidebar to start chatting</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const label = getDateLabel(message.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(message);
    return groups;
  }, {});

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        {/* Back button — only visually shown on mobile via CSS.
            onBack tells App.js to slide the sidebar back in. */}
        <button
          className="back-btn"
          onClick={onBack}
          aria-label="Back to contacts"
        >
          ‹
        </button>

        <div className="chat-header-user">
          <div className="avatar">
            {selectedUser.avatar ? (
              <img src={selectedUser.avatar} alt={selectedUser.name} />
            ) : (
              <span>{getInitials(selectedUser.name)}</span>
            )}
            {isOnline(selectedUser._id) && (
              <span className="status-dot online" />
            )}
          </div>
          <div className="chat-header-info">
            <h3>{selectedUser.name}</h3>
            <span className="chat-header-status">
              {isTyping(selectedUser._id)
                ? "typing..."
                : isOnline(selectedUser._id)
                  ? "Online"
                  : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {loadingMessages ? (
          <div className="messages-loading">
            <span className="spinner" />
            <span>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([label, msgs]) => (
            <div key={label}>
              <div className="date-divider">
                <span>{label}</span>
              </div>
              {msgs.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={(message.sender._id || message.sender) === user._id}
                />
              ))}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping(selectedUser._id) && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
};

export default ChatWindow;
