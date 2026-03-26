const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  age: Number,
  height: Number,
  weight: Number,
  goal: String,
  goalWeight: Number,
});

module.exports = mongoose.model("User", UserSchema);