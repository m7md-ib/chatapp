const express = require("express");
const router = express.Router();
const {
  getConversation,
  uploadImage,
  markAsSeen,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/:userId", protect, getConversation);
router.post("/upload-image", protect, upload.single("image"), uploadImage);
router.put("/seen/:senderId", protect, markAsSeen);

module.exports = router;
