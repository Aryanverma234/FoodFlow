const express = require("express");

const {
  getMyProfile,
} = require("../controllers/userController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, getMyProfile);

module.exports = router;