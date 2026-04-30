const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token — throws clearly if JWT_SECRET is missing
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error.name, error.message);

    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ message: msg });
    }
    if (error.message.includes("JWT_SECRET")) {
      return res
        .status(500)
        .json({ message: "Server misconfiguration: JWT_SECRET missing" });
    }
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ message: "Database connection failed. Check MONGO_URI." });
    }

    res.status(500).json({
      message: "Server error during registration",
      detail: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Explicitly select password — excluded by default via `select: false` on schema
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Use findByIdAndUpdate to avoid re-triggering password hashing hook
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error.name, error.message);

    if (error.message.includes("JWT_SECRET")) {
      return res
        .status(500)
        .json({ message: "Server misconfiguration: JWT_SECRET missing" });
    }
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ message: "Database connection failed. Check MONGO_URI." });
    }

    res.status(500).json({
      message: "Server error during login",
      detail: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
