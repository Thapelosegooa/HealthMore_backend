const mongoose = require("mongoose");

const CaloriesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  dailyLimit: { type: Number, default: 2000 },
  consumed: { type: Number, default: 0 },

  date: { type: String }, // YYYY-MM-DD
});

module.exports = mongoose.model("Calories", CaloriesSchema);