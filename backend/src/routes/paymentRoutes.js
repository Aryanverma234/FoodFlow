const express = require("express");

const {
  getMyPayments,
  getPaymentByOrder,
  simulateMockPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Get logged-in customer's payment history
router.get("/", protect, getMyPayments);

// Get payment details for a specific order
router.get("/order/:orderId", protect, getPaymentByOrder);

// Create a Razorpay order
router.post("/razorpay/order", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

// Mock payment is available only in development
if (process.env.NODE_ENV !== "production") {
  router.post("/mock", protect, simulateMockPayment);
}

module.exports = router;