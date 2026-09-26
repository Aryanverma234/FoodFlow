const express = require("express");

const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  getMyRestaurants,
  approveRestaurant,
} = require("../controllers/restaurantController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// =====================================
// GET ALL APPROVED RESTAURANTS
// PUBLIC
// =====================================
router.get("/", getAllRestaurants);

// =====================================
// GET MY RESTAURANTS
// RESTAURANT OWNER ONLY
// =====================================
router.get(
  "/my",
  protect,
  authorizeRoles("restaurant"),
  getMyRestaurants
);

// =====================================
// CREATE RESTAURANT
// RESTAURANT OWNER ONLY
// =====================================
router.post(
  "/",
  protect,
  authorizeRoles("restaurant"),
  createRestaurant
);

// =====================================
// GET RESTAURANT BY ID
// PUBLIC
// =====================================
router.get("/:id", getRestaurantById);

// =====================================
// APPROVE RESTAURANT
// ADMIN ONLY
// =====================================
router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  approveRestaurant
);

module.exports = router;