const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Weight = require("../models/Weight");
const auth = require("../middleware/authMiddleware");



const router = express.Router();

// helper for today's date
const getToday = () => new Date().toISOString().split("T")[0];

//register
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      age,
      height,
      weight,
      goal,
      goalWeight,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      age,
      height,
      weight,
      goal,
      goalWeight,
    });

    await newUser.save();

    //create weight record
    if (weight && Number(weight) > 0) {
      await new Weight({
        userId: newUser._id,
        weight: Number(weight),
        date: getToday(),
      }).save();
    }

    res.json({ msg: "User registered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
      id: user._id,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      goal: user.goal,
      goalWeight: user.goalWeight,
    },

    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const {
      age,
      height,
      goal,
      goalWeight,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Validate values
    if (
      age === undefined ||
      height === undefined ||
      goal === undefined ||
      goalWeight === undefined
    ) {
      return res.status(400).json({
        msg: "Age, height, goal and goal weight are required",
      });
    }

    if (Number(age) <= 0) {
      return res.status(400).json({
        msg: "Invalid age",
      });
    }

    if (Number(height) <= 0) {
      return res.status(400).json({
        msg: "Invalid height",
      });
    }

    if (Number(goalWeight) <= 0) {
      return res.status(400).json({
        msg: "Invalid goal weight",
      });
    }

    // Update profile
    user.age = Number(age);
    user.height = Number(height);
    user.goal = goal;
    user.goalWeight = Number(goalWeight);

    await user.save();

    res.json({
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        goal: user.goal,
        goalWeight: user.goalWeight,
      },
    });
  } catch (err) {
    console.log("Profile update error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});


module.exports = router;