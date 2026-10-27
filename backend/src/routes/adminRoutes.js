
const express = require("express");

const {
  createRestaurantOwner,
  getAllRestaurantOwners,
  getAllAdminRestaurants,
  approveRestaurant,
  getAllAdminOrders,
  getAdminStats,
} = require("../controllers/adminController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// Admin-only: Create restaurant owner
router.post(
  "/owners",
  protect,
  authorizeRoles("admin"),
  createRestaurantOwner
);

// Admin-only: Get all restaurant owners
router.get(
  "/owners",
  protect,
  authorizeRoles("admin"),
  getAllRestaurantOwners
);

// Admin-only: Get all restaurants
router.get(
  "/restaurants",
  protect,
  authorizeRoles("admin"),
  getAllAdminRestaurants
);

// Admin-only: Approve restaurant
router.patch(
  "/restaurants/:id/approve",
  protect,
  authorizeRoles("admin"),
  approveRestaurant
);

// Admin-only: Get all platform orders
router.get(
  "/orders",
  protect,
  authorizeRoles("admin"),
  getAllAdminOrders
);

// Admin-only: Get platform statistics
router.get(
  "/stats",
  protect,
  authorizeRoles("admin"),
  getAdminStats
);

module.exports = router;
