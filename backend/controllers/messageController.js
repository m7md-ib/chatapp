const Message = require("../models/Message");

// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Fetch messages between the two users in chronological order
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// @desc    Upload an image message
// @route   POST /api/messages/upload-image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ message: "Server error uploading image" });
  }
};

// @desc    Mark messages as seen
// @route   PUT /api/messages/seen/:senderId
// @access  Private
const markAsSeen = async (req, res) => {
  try {
    const { senderId } = req.params;

    await Message.updateMany(
      { sender: senderId, receiver: req.user._id, status: { $ne: "seen" } },
      { status: "seen" }
    );

    res.json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Mark as seen error:", error);
    res.status(500).json({ message: "Server error marking messages" });
  }
};

module.exports = { getConversation, uploadImage, markAsSeen };
