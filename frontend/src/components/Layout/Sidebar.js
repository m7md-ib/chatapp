import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { formatDistanceToNow } from "date-fns";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { users, selectedUser, setSelectedUser, isOnline, unreadCounts } = useChat();
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user" title={user.email}>
          <div className="avatar avatar-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
            <span className="status-dot online" />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-status">Active</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User list */}
      <div className="users-list">
        <div className="users-list-label">
          {filteredUsers.length} {filteredUsers.length === 1 ? "Contact" : "Contacts"}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-users">No users found</div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u._id}
              className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="avatar">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} />
                ) : (
                  <span>{getInitials(u.name)}</span>
                )}
                {isOnline(u._id) && <span className="status-dot online" />}
              </div>

              <div className="user-item-info">
                <div className="user-item-top">
                  <span className="user-item-name">{u.name}</span>
                  {u.lastSeen && !isOnline(u._id) && (
                    <span className="user-item-time">
                      {formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="user-item-bottom">
                  <span className="user-item-status">
                    {isOnline(u._id) ? "Online" : "Offline"}
                  </span>
                  {unreadCounts[u._id] > 0 && (
                    <span className="unread-badge">{unreadCounts[u._id]}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
