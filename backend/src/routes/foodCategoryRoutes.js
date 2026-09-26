const express = require("express");

const {
  createFoodCategory,
  getRestaurantCategories,
  getMyRestaurantCategories,
  updateFoodCategory,
  deleteFoodCategory,
} = require("../controllers/foodCategoryController");

const protect = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// =====================================
// CREATE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// =====================================
router.post(
  "/",
  protect,
  authorizeRoles("restaurant"),
  createFoodCategory
);

// =====================================
// GET PUBLIC RESTAURANT CATEGORIES
// PUBLIC
// =====================================
router.get(
  "/restaurant/:restaurantId",
  getRestaurantCategories
);

// =====================================
// GET MY RESTAURANT CATEGORIES
// RESTAURANT OWNER ONLY
// =====================================
router.get(
  "/my/:restaurantId",
  protect,
  authorizeRoles("restaurant"),
  getMyRestaurantCategories
);

// =====================================
// UPDATE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// =====================================
router.patch(
  "/:id",
  protect,
  authorizeRoles("restaurant"),
  updateFoodCategory
);

// =====================================
// DELETE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// =====================================
router.delete(
  "/:id",
  protect,
  authorizeRoles("restaurant"),
  deleteFoodCategory
);

module.exports = router;