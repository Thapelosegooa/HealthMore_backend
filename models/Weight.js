const mongoose = require("mongoose");

const WeightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  weight: { type: Number, required: true },

  date: { type: String }, // YYYY-MM-DD
});

module.exports = mongoose.model("Weight", WeightSchema);