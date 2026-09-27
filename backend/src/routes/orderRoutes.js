const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getRestaurantOrders,
   updateOrderStatus,
} = require("../controllers/orderController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// Customer
router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.get("/:id", protect, getOrderById);

router.patch("/:id/cancel", protect, cancelOrder);

// Restaurant
router.get(
  "/restaurant/:restaurantId",
  protect,
  authorizeRoles("restaurant"),
  getRestaurantOrders
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("restaurant"),
  updateOrderStatus
);

module.exports = router;