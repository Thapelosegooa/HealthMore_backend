
const User = require("../models/User");
const { generateChatResponse } = require("../services/aiService");

// Initial greeting
const getGreeting = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email");

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


// Chat endpoint
const sendChatMessage = async (req, res) => {
  try {
    const {
      planType,
      message,
      history = [],
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

    // Validate history
    console.log("========== CHAT DEBUG ==========");
console.log("Plan type:", planType);
console.log("Message:", message);
console.log("History:", JSON.stringify(history, null, 2));
console.log("History is array:", Array.isArray(history));
console.log("================================");
    // Validate conversation history
    
// Validate conversation history (OpenAI format)
if (!Array.isArray(history) || history.length > 30) {
  return res.status(400).json({
    msg: "Invalid conversation history",
  });
}

const validHistory = history.every(
  (item) =>
    item &&
    ["user", "assistant"].includes(item.role) &&
    typeof item.content === "string" &&
    item.content.trim().length > 0 &&
    item.content.length <= 10000
);

if (!validHistory) {
  console.log("Invalid history received:", history);

  return res.status(400).json({
    msg: "Invalid conversation history format",
  });
}


    ///////////////////
    console.log("History validation result:", validHistory);

    // Retrieve authenticated user's profile
    const user = await User.findById(req.user.id)
      .select("age height weight goal goalWeight");

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // Generate AI response using Groq
    const aiResponse = await generateChatResponse(
      user,
      planType,
      history,
      message.trim()
    );

    return res.json({
      response: aiResponse,
    });

  } catch (err) {
    console.error("AI chat error:", err);

    const status = Number(err.status || err.code);

    if (status === 429) {
      return res.status(429).json({
        msg: "The AI assistant has reached its request limit. Please try again shortly.",
      });
    }

    if (status === 503 || status === 502 || status === 504) {
      return res.status(503).json({
        msg: "The AI assistant is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({
      msg: "Unable to generate an AI response. Please try again.",
    });
  }
};


module.exports = {
  getGreeting,
  sendChatMessage,
};
