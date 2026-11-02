const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after 15 minutes.",
  },
});
const router = express.Router();

router.post("/register", registerLimiter, registerUser);

router.post("/login", loginLimiter, loginUser);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

router.get(
  "/customer-only",
  protect,
  authorizeRoles("customer"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Customer-only route accessed successfully",
      user: req.user,
    });
  }
);

module.exports = router;