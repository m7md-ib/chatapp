import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Layout/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import "./App.css";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  // Mobile sidebar visibility — true = sidebar open (default on mobile),
  // false = chat window visible. Desktop ignores this via CSS.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="logo-icon large">💬</div>
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-bg" />
        {showLogin ? (
          <Login onSwitch={() => setShowLogin(false)} />
        ) : (
          <Register onSwitch={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return (
    <ChatProvider>
      <div className="app-layout">
        {/* Sidebar — gets .hidden on mobile when a chat is open */}
        <Sidebar
          className={sidebarOpen ? "" : "hidden"}
          onSelectUser={() => setSidebarOpen(false)}
        />

        {/* Dark backdrop — only visible on mobile when sidebar is open */}
        <div
          className={`sidebar-backdrop ${sidebarOpen ? "" : "hidden"}`}
          onClick={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          {/* Pass onBack so ChatWindow can show the back button on mobile */}
          <ChatWindow onBack={() => setSidebarOpen(true)} />
        </main>
      </div>
    </ChatProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
