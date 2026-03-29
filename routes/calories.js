const express = require("express");
const router = express.Router();
const Calories = require("../models/Calories");
const auth = require("../middleware/authMiddleware");

// Helper: get today string
const getToday = () => new Date().toISOString().split("T")[0];


//get current calories
router.get("/", auth, async (req, res) => {
  try {
    const today = getToday();

    let record = await Calories.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!record) {
      record = new Calories({
        userId: req.user.id,
        date: today,
        dailyLimit: 2000,
        consumed: 0,
      });

      await record.save();
    }

    res.json(record);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


//set daily calories
router.post("/set", auth, async (req, res) => {
  try {
    const { dailyLimit } = req.body;

    if (!dailyLimit || Number(dailyLimit) <= 0) {
      return res.status(400).json({ msg: "Invalid dailyLimit" });
    }

    const today = getToday();

    let record = await Calories.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!record) {
      record = new Calories({
        userId: req.user.id,
        date: today,
        consumed: 0,
      });
    }

    record.dailyLimit = Number(dailyLimit);

    await record.save();

    res.json(record);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


//add calories
router.post("/add", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const today = getToday();

    let record = await Calories.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!record) {
      record = new Calories({
        userId: req.user.id,
        date: today,
        dailyLimit: 2000,
        consumed: 0,
      });
    }

    record.consumed += Number(amount);

    await record.save();

    res.json(record);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


//clear calories by setting consumed to 0
router.post("/clear", auth, async (req, res) => {
  try {
    const today = getToday();

    let record = await Calories.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!record) {
      // If no record exists yet, create one with 0 consumed
      record = new Calories({
        userId: req.user.id,
        date: today,
        consumed: 0,
      });
    } else {
      // Just reset consumed to 0
      record.consumed = 0;
    }

    await record.save();
    res.json(record); // return updated record
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// weekly calories (unchanged)
router.get("/weekly", auth, async (req, res) => {
  try {
    const last7Days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const records = await Calories.find({
      userId: req.user.id,
      date: { $in: last7Days },
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;