const express = require("express");

const {
  createCoupon,
  getActiveCoupons,
  getMyCoupons,
  validateCoupon,
} = require("../controllers/couponController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// Public/customer
router.get("/", getActiveCoupons);

router.post("/validate", protect, validateCoupon);

// Restaurant
router.get(
  "/my",
  protect,
  authorizeRoles("restaurant"),
  getMyCoupons
);

router.post(
  "/",
  protect,
  authorizeRoles("restaurant"),
  createCoupon
);

module.exports = router;