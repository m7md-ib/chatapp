import React, { useState } from "react";
import { format } from "date-fns";

const MessageBubble = ({ message, isOwn }) => {
  const [imgError, setImgError] = useState(false);

  const renderStatus = () => {
    if (!isOwn) return null;
    const { status } = message;
    return (
      <span className={`msg-status msg-status-${status}`} title={status}>
        {status === "sent" && (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
        {status === "delivered" && (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M.41 13.41L6 19l1.41-1.42L1.83 12zm20.07-8.49l-9.66 9.66-3.72-3.73L5.69 12l4.41 4.41L21.9 6.34z" />
          </svg>
        )}
        {status === "seen" && (
          <svg viewBox="0 0 24 24" fill="#4fc3f7">
            <path d="M.41 13.41L6 19l1.41-1.42L1.83 12zm20.07-8.49l-9.66 9.66-3.72-3.73L5.69 12l4.41 4.41L21.9 6.34z" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className={`message-wrapper ${isOwn ? "own" : "other"}`}>
      <div className={`message-bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
        {/* Image message */}
        {message.type === "image" && message.imageUrl && !imgError ? (
          <div className="msg-image-container">
            <img
              src={message.imageUrl}
              alt="Shared"
              className="msg-image"
              onError={() => setImgError(true)}
              onClick={() => window.open(message.imageUrl, "_blank")}
            />
          </div>
        ) : message.type === "image" && imgError ? (
          <span className="img-error">⚠️ Image unavailable</span>
        ) : null}

        {/* Text content */}
        {message.content && (
          <p className="msg-text">{message.content}</p>
        )}

        {/* Time and status */}
        <div className="msg-meta">
          <span className="msg-time">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
