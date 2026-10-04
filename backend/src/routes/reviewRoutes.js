const express = require("express");

const {
  createReview,
} = require("../controllers/reviewController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createReview);

module.exports = router;