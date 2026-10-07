const mongoose = require("mongoose");

const WeightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  weight: {
    type: Number,
    required: true,
  },

  date: {
    type: String,
    required: true,
  },
});

// Prevent multiple weight records for the same user/day
WeightSchema.index(
  { userId: 1, date: 1 },
  { unique: true }
);

module.exports =
  mongoose.model("Weight", WeightSchema);
