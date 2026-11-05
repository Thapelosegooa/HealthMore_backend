const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getGreeting,
  sendChatMessage,
} = require("../controllers/aiController");

// Initial greeting
router.get("/greeting", auth, getGreeting);

// Send chat message
router.post("/chat", auth, sendChatMessage);

module.exports = router;