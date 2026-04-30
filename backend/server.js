require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// CORS configuration — allows your Vercel frontend + local dev
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  // Add every frontend URL here, or use CLIENT_URL env var
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      // Allow any Vercel preview/production deployment
      if (origin.match(/https:\/\/.*\.vercel\.app$/))
        return callback(null, true);

      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow all in development
      if (process.env.NODE_ENV !== "production") return callback(null, true);

      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ChatApp API is running" });
});

// Reusable origin checker (used by both Express CORS and Socket.IO)
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin.match(/https:\/\/.*\.vercel\.app$/)) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      isAllowedOrigin(origin)
        ? callback(null, true)
        : callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // 60s before disconnect if no response
  pingInterval: 25000, // ping every 25s to keep connection alive
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
