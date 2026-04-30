import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { connectSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      connectSocket(parsedUser._id);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    // ROOT CAUSE FIX: The API returns { token, user: {...} }.
    // Previously the entire `data` object was stored as the user, so
    // `user._id` was undefined everywhere — breaking message fetching,
    // socket registration, and seen receipts.
    // Now we correctly split token and user before storing them.
    const { token, user: userData } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData._id);
    return userData;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    // Same fix applied to register
    const { token, user: userData } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData._id);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
  };

  // Update user state (e.g., after avatar change)
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem("user", JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
