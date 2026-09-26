const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.get("/:id", protect, getOrderById);

router.patch("/:id/cancel", protect, cancelOrder);

module.exports = router;