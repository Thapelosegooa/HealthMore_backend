const express = require("express");
const router = express.Router();

const Feedback = require("../models/Feedback");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// Send feedback
router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({
        msg: "Feedback message is required",
      });
    }

    // Limit feedback length
    if (message.trim().length > 2000) {
      return res.status(400).json({
        msg: "Feedback must be less than 2000 characters",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId: user._id,
      email: user.email,
      message: message.trim(),
    });

    await feedback.save();

    res.status(201).json({
      msg: "Feedback sent successfully",
      feedback: {
        id: feedback._id,
        message: feedback.message,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    });
  } catch (err) {
    console.log("Feedback error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;