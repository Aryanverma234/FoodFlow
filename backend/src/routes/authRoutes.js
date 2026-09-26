const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

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