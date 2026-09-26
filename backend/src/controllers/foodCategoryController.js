const FoodCategory = require("../models/FoodCategory");
const Restaurant = require("../models/Restaurant");

// ===============================
// CREATE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// ===============================
const createFoodCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      restaurant,
      image,
      sortOrder,
    } = req.body;

    // Required fields
    if (!name || !restaurant) {
      return res.status(400).json({
        success: false,
        message: "Category name and restaurant are required",
      });
    }

    // Check restaurant exists
    const existingRestaurant = await Restaurant.findById(
      restaurant
    );

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check ownership
    if (
      existingRestaurant.owner.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to manage this restaurant",
      });
    }

    // Check duplicate category
    const existingCategory = await FoodCategory.findOne({
      restaurant,
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "This category already exists",
      });
    }

    // Create category
    const category = await FoodCategory.create({
      name: name.trim(),
      description,
      restaurant,
      image,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      message: "Food category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Food Category Error:", error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This category already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating food category",
    });
  }
};

// ===============================
// GET RESTAURANT CATEGORIES
// PUBLIC
// ===============================
const getRestaurantCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Check restaurant exists
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const categories = await FoodCategory.find({
      restaurant: restaurantId,
      isActive: true,
    }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Restaurant Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
};

// ===============================
// GET MY RESTAURANT CATEGORIES
// RESTAURANT OWNER ONLY
// ===============================
const getMyRestaurantCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Check restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message:
          "Restaurant not found or you don't have access",
      });
    }

    const categories = await FoodCategory.find({
      restaurant: restaurantId,
      isActive: true,
    }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error(
      "Get My Restaurant Categories Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching your categories",
    });
  }
};

// ===============================
// UPDATE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// ===============================
const updateFoodCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await FoodCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    // Check restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: category.restaurant,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to update this category",
      });
    }

    const {
      name,
      description,
      image,
      sortOrder,
      isActive,
    } = req.body;

    if (name !== undefined) {
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (image !== undefined) {
      category.image = image;
    }

    if (sortOrder !== undefined) {
      category.sortOrder = sortOrder;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Food category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update Food Category Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This category already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating food category",
    });
  }
};

// ===============================
// DELETE FOOD CATEGORY
// RESTAURANT OWNER ONLY
// ===============================
const deleteFoodCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await FoodCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    // Check restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: category.restaurant,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to delete this category",
      });
    }

    // Soft delete
    category.isActive = false;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Food category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Food Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting food category",
    });
  }
};

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  createFoodCategory,
  getRestaurantCategories,
  getMyRestaurantCategories,
  updateFoodCategory,
  deleteFoodCategory,
};