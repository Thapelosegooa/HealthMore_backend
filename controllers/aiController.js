
const User = require("../models/User");
const Chat = require("../models/Chat");

const {
  generateChatResponse,
} = require("../services/aiService");


// Initial greeting
const getGreeting = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("email");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const displayName = user.email.split("@")[0];

    return res.json({
      message: `Hello ${displayName}! 👋 Welcome to your fitness assistant. I'm here to help you reach your fitness goals. What would you like to work on today?`,
    });

  } catch (err) {
    console.error("Greeting error:", err);

    return res.status(500).json({
      msg: "Could not load greeting",
    });
  }
};


// Send chat message
const sendChatMessage = async (req, res) => {
  try {
    const {
      planType,
      message,
      chatId,
    } = req.body;

    // Validate plan type
    if (!["workout", "meal"].includes(planType)) {
      return res.status(400).json({
        msg: "Invalid plan type",
      });
    }

    // Validate message
    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 3000
    ) {
      return res.status(400).json({
        msg: "Invalid message",
      });
    }

    const user = await User.findById(req.user.id)
      .select("age height weight goal goalWeight");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    let chat;

    // Continue existing conversation
    if (chatId) {
      if (!/^[a-fA-F0-9]{24}$/.test(chatId)) {
        return res.status(400).json({
          msg: "Invalid chat ID",
        });
      }

      chat = await Chat.findOne({
        _id: chatId,
        user: req.user.id,
      });

      if (!chat) {
        return res.status(404).json({
          msg: "Conversation not found",
        });
      }

      if (chat.planType !== planType) {
        return res.status(400).json({
          msg: "Conversation type mismatch",
        });
      }

    } else {
      // Create a new conversation
      chat = new Chat({
        user: req.user.id,
        planType,
        title: message.trim().slice(0, 60),
        messages: [],
      });
    }

    // Retrieve conversation history from MongoDB
    const history = chat.messages.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    // Generate AI response
    const aiResponse = await generateChatResponse(
      user,
      planType,
      history,
      message.trim()
    );

    // Save user message
    chat.messages.push({
      role: "user",
      content: message.trim(),
    });

    // Save assistant response
    chat.messages.push({
      role: "assistant",
      content: aiResponse,
    });

    // Update conversation
    await chat.save();

    return res.json({
      response: aiResponse,
      chatId: chat._id,
      title: chat.title,
      messages: chat.messages,
    });

  } catch (err) {
    console.error("AI chat error:", err);

    const status = Number(err.status || err.code);

    if (status === 429) {
      return res.status(429).json({
        msg: "The AI assistant has reached its request limit. Please try again shortly.",
      });
    }

    if ([503, 502, 504].includes(status)) {
      return res.status(503).json({
        msg: "The AI assistant is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({
      msg: "Unable to generate an AI response. Please try again.",
    });
  }
};


// Get all conversations
const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({
      user: req.user.id,
    })
      .select("planType title createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      chats,
    });

  } catch (err) {
    console.error("Get chat history error:", err);

    return res.status(500).json({
      msg: "Unable to retrieve chat history",
    });
  }
};


// Get one conversation
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        msg: "Conversation not found",
      });
    }

    return res.json({
      chat,
    });

  } catch (err) {
    return res.status(400).json({
      msg: "Invalid chat ID",
    });
  }
};


// Delete one conversation
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      user: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        msg: "Conversation not found",
      });
    }

    return res.json({
      msg: "Conversation deleted successfully",
      chatId: req.params.chatId,
    });

  } catch (err) {
    console.error("Delete chat error:", err);

    return res.status(500).json({
      msg: "Unable to delete conversation",
    });
  }
};


// Delete all conversations
const deleteAllChats = async (req, res) => {
  try {
    const result = await Chat.deleteMany({
      user: req.user.id,
    });

    return res.json({
      msg: "All conversations deleted successfully",
      deletedCount: result.deletedCount,
    });

  } catch (err) {
    console.error("Delete all chats error:", err);

    return res.status(500).json({
      msg: "Unable to delete conversations",
    });
  }
};


module.exports = {
  getGreeting,
  sendChatMessage,
  getChatHistory,
  getChatById,
  deleteChat,
  deleteAllChats,
};
