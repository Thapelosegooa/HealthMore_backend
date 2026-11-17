
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getGreeting,
  sendChatMessage,
  getChatHistory,
  getChatById,
  deleteChat,
  deleteAllChats,
} = require("../controllers/aiController");


// Greeting
router.get("/greeting", auth, getGreeting);

// Send message / create conversation
router.post("/chat", auth, sendChatMessage);

// Get all conversations
router.get("/history", auth, getChatHistory);

// Get specific conversation
router.get("/history/:chatId", auth, getChatById);

// Delete all conversations
router.delete("/history", auth, deleteAllChats);

// Delete individual conversation
router.delete("/history/:chatId", auth, deleteChat);

module.exports = router;
