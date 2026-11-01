
const express = require("express");

const {
  createRestaurantOwner,
  getAllRestaurantOwners,
  toggleOwnerStatus,
  getAllCustomers,
  toggleCustomerStatus,
  getAllAdminRestaurants,
  approveRestaurant,
  toggleRestaurantStatus,
  getAllAdminOrders,
  getAdminStats,
} = require("../controllers/adminController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// RESTAURANT OWNERS
router.post("/owners", protect, authorizeRoles("admin"), createRestaurantOwner);
router.get("/owners", protect, authorizeRoles("admin"), getAllRestaurantOwners);
router.patch("/owners/:id/status", protect, authorizeRoles("admin"), toggleOwnerStatus);

// CUSTOMERS
router.get("/customers", protect, authorizeRoles("admin"), getAllCustomers);
router.patch("/customers/:id/status", protect, authorizeRoles("admin"), toggleCustomerStatus);

// RESTAURANTS
router.get("/restaurants", protect, authorizeRoles("admin"), getAllAdminRestaurants);
router.patch("/restaurants/:id/approve", protect, authorizeRoles("admin"), approveRestaurant);
router.patch("/restaurants/:id/status", protect, authorizeRoles("admin"), toggleRestaurantStatus);

// ORDERS
router.get("/orders", protect, authorizeRoles("admin"), getAllAdminOrders);

// DASHBOARD STATS
router.get("/stats", protect, authorizeRoles("admin"), getAdminStats);

module.exports = router;
