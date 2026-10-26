
const express = require("express");

const {
  createRestaurantOwner,
  getAllRestaurantOwners,
  getAllAdminRestaurants,
  approveRestaurant,
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

module.exports = router;
