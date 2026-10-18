const express = require("express");

const {
  getMyPayments,
  getPaymentByOrder,
} = require("../controllers/paymentController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Get logged-in customer's payment history
router.get("/", protect, getMyPayments);

// Get payment details for a specific order
router.get("/order/:orderId", protect, getPaymentByOrder);

module.exports = router;