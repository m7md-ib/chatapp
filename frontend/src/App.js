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
        <Sidebar />
        <main className="main-content">
          <ChatWindow />
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
