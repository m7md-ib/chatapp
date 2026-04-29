const express = require("express");
const router = express.Router();
const { getUsers, updateAvatar } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", protect, getUsers);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

module.exports = router;
