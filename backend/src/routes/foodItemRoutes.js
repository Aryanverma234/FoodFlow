const express = require("express");

const {
  createFoodItem,
  getRestaurantFoodItems,
  getFoodItemById,
  getMyRestaurantFoodItems,
  updateFoodItem,
  deleteFoodItem,
} = require("../controllers/foodItemController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// =====================================
// CREATE FOOD ITEM
// RESTAURANT OWNER ONLY
// =====================================
router.post(
  "/",
  protect,
  authorizeRoles("restaurant"),
  createFoodItem
);

// =====================================
// GET ALL FOOD ITEMS OF RESTAURANT
// PUBLIC
// =====================================
router.get(
  "/restaurant/:restaurantId",
  getRestaurantFoodItems
);

// =====================================
// GET MY RESTAURANT FOOD ITEMS
// RESTAURANT OWNER ONLY
// =====================================
router.get(
  "/my/:restaurantId",
  protect,
  authorizeRoles("restaurant"),
  getMyRestaurantFoodItems
);

// =====================================
// GET FOOD ITEM BY ID
// PUBLIC
// =====================================
router.get("/:id", getFoodItemById);

// =====================================
// UPDATE FOOD ITEM
// RESTAURANT OWNER ONLY
// =====================================
router.patch(
  "/:id",
  protect,
  authorizeRoles("restaurant"),
  updateFoodItem
);

// =====================================
// DELETE FOOD ITEM
// RESTAURANT OWNER ONLY
// =====================================
router.delete(
  "/:id",
  protect,
  authorizeRoles("restaurant"),
  deleteFoodItem
);

module.exports = router;