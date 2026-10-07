const express = require("express");
const router = express.Router();
const Weight = require("../models/Weight");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

// Helper: get today string
const getToday = () => new Date().toISOString().split("T")[0];


//get current weight
router.get("/", auth, async (req, res) => {
  try {
    const today = getToday();

    let record = await Weight.findOne({
      userId: req.user.id,
      date: today,
    });

    //if no weight today use previous weight
    if (!record) {
      const lastRecord = await Weight.findOne({
        userId: req.user.id,
      }).sort({ date: -1 });

      if (lastRecord) {
        record = lastRecord;
      } else {
        return res.json({ weight: 0 });
      }
    }

    res.json({ weight: record.weight });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


// set and update weight for today
router.post("/set", auth, async (req, res) => {
  try {
    const { weight } = req.body;

    if (!weight || Number(weight) <= 0) {
      return res.status(400).json({ msg: "Invalid weight" });
    }

    const newWeight = Number(weight);
    const today = getToday();

    // Find today's weight record
    let record = await Weight.findOne({
      userId: req.user.id,
      date: today,
    });

    // Create today's record if it doesn't exist
    if (!record) {
      record = new Weight({
        userId: req.user.id,
        date: today,
      });
    }

    record.weight = newWeight;

    await record.save();

    // Update current weight on User
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.weight = newWeight;

    await user.save();

    res.json({
      msg: "Weight updated successfully",
      weight: newWeight,
      record,
    });
  } catch (err) {
    console.log("Weight update error:", err);
    res.status(500).json({ error: err.message });
  }
});



//weekly weight
// weekly weight
router.get("/weekly", auth, async (req, res) => {
  try {
    // -----------------------------------------
    // Create the last 7 days
    // -----------------------------------------

    const last7Days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();

      d.setDate(
        d.getDate() - i
      );

      last7Days.push(
        d.toISOString().split("T")[0]
      );
    }

    // -----------------------------------------
    // Start of the 7-day period
    // -----------------------------------------

    const startDate =
      last7Days[last7Days.length - 1];

    // -----------------------------------------
    // Get weights recorded during the
    // last 7 days
    // -----------------------------------------

    const weeklyRecords =
      await Weight.find({
        userId: req.user.id,

        date: {
          $in: last7Days,
        },
      }).sort({
        date: 1,
      });

    // -----------------------------------------
    // Find the most recent weight BEFORE
    // the 7-day period
    // -----------------------------------------

    const previousRecord =
      await Weight.findOne({
        userId: req.user.id,

        date: {
          $lt: startDate,
        },
      }).sort({
        date: -1,
      });

    // -----------------------------------------
    // Return previous weight as well
    // -----------------------------------------

    const records = [];

    if (previousRecord) {
      records.push(previousRecord);
    }

    records.push(
      ...weeklyRecords
    );

    res.json(records);
  } catch (err) {
    console.log(
      "Weekly weight error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


module.exports = router;