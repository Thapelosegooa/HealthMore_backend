const express = require("express");
const router = express.Router();
const Weight = require("../models/Weight");
const auth = require("../middleware/authMiddleware");

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

    const today = getToday();

    let record = await Weight.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!record) {
      record = new Weight({
        userId: req.user.id,
        date: today,
      });
    }

    record.weight = Number(weight);

    await record.save();

    res.json(record);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


//weekly weight
router.get("/weekly", auth, async (req, res) => {
  try {
    const last7Days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const records = await Weight.find({
      userId: req.user.id,
      date: { $in: last7Days },
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;