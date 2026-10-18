const express = require("express");

const {
  getMyPayments,
  getPaymentByOrder,
  simulateMockPayment,
} = require("../controllers/paymentController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Get logged-in customer's payment history
router.get("/", protect, getMyPayments);

// Get payment details for a specific order
router.get("/order/:orderId", protect, getPaymentByOrder);

// Simulate a mock payment for project demonstration
router.post("/mock", protect, simulateMockPayment);

module.exports = router;