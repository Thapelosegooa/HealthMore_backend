const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const calorieRoutes = require("./routes/calories");
const weightRoutes = require("./routes/weight");
const feedbackRoutes = require("./routes/feedback");
const aiRoutes = require("./routes/aiRoutes");
const foodScannerRoutes = require("./routes/foodScanner");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/calories", calorieRoutes);
app.use("/api/weight", weightRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/food", foodScannerRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});