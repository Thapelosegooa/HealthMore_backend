
const express = require("express");
const multer = require("multer");

const { scanFood } = require("../services/foodScannerService");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported image format"));
    }

    cb(null, true);
  }
});

router.post("/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No image provided"
      });
    }

    const calories = await scanFood(
      req.file.buffer,
      req.file.mimetype
    );

    if (calories === null) {
      return res.status(422).json({
        error: "No identifiable food found"
      });
    }

    return res.json({ calories });

  } catch (error) {
    console.error("Food scanner error:", error);

    return res.status(500).json({
      error: "Unable to analyse food image"
    });
  }
});

// Handle Multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 10MB"
        : "Image upload failed"
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Invalid image upload"
    });
  }

  next();
});

module.exports = router;
