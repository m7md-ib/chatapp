const User = require("../models/User");
const { onlineUsers } = require("../config/socket");

// @desc    Get all users except the logged-in user
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ name: 1 });

    // Attach online status to each user
    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      isOnline: onlineUsers.has(user._id.toString()),
    }));

    res.json(usersWithStatus);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// @desc    Upload or update avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ message: "Server error updating avatar" });
  }
};

module.exports = { getUsers, updateAvatar };
