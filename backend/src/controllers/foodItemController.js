const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const FoodCategory = require("../models/FoodCategory");

// ===============================
// CREATE FOOD ITEM
// RESTAURANT OWNER ONLY
// ===============================
const createFoodItem = async (req, res) => {
  try {
    const {
      name,
      description,
      restaurant,
      category,
      price,
      discountPrice,
      image,
      isVeg,
      ingredients,
      preparationTime,
      isAvailable,
      isFeatured,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!name || !restaurant || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Name, restaurant, category and price are required",
      });
    }

    // ===============================
    // CHECK RESTAURANT
    // ===============================
    const existingRestaurant = await Restaurant.findById(
      restaurant
    );

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // ===============================
    // CHECK OWNERSHIP
    // ===============================
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

    // ===============================
    // CHECK RESTAURANT STATUS
    // ===============================
    if (!existingRestaurant.isActive) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is inactive",
      });
    }

    // ===============================
    // CHECK CATEGORY
    // ===============================
    const existingCategory = await FoodCategory.findOne({
      _id: category,
      restaurant,
      isActive: true,
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found or category does not belong to this restaurant",
      });
    }

    // ===============================
    // VALIDATE DISCOUNT
    // ===============================
    if (
      discountPrice !== undefined &&
      discountPrice !== null &&
      Number(discountPrice) >= Number(price)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount price must be less than original price",
      });
    }

    // ===============================
    // CREATE FOOD ITEM
    // ===============================
    const foodItem = await FoodItem.create({
      name: name.trim(),
      description,
      restaurant,
      category,
      price,
      discountPrice:
        discountPrice !== undefined &&
        discountPrice !== null
          ? discountPrice
          : null,
      image,
      isVeg:
        isVeg !== undefined
          ? isVeg
          : true,
      ingredients,
      preparationTime,
      isAvailable:
        isAvailable !== undefined
          ? isAvailable
          : true,
      isFeatured:
        isFeatured !== undefined
          ? isFeatured
          : false,
    });

    res.status(201).json({
      success: true,
      message: "Food item created successfully",
      foodItem,
    });
  } catch (error) {
    console.error("Create Food Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating food item",
    });
  }
};

// ===============================
// GET ALL FOOD ITEMS OF RESTAURANT
// PUBLIC
// ===============================
const getRestaurantFoodItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // ===============================
    // CHECK RESTAURANT
    // ===============================
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

    // ===============================
    // GET FOOD ITEMS
    // ===============================
    const foodItems = await FoodItem.find({
      restaurant: restaurantId,
      isActive: true,
      isAvailable: true,
    })
      .populate("category", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foodItems.length,
      foodItems,
    });
  } catch (error) {
    console.error(
      "Get Restaurant Food Items Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching restaurant food items",
    });
  }
};

// ===============================
// GET FOOD ITEM BY ID
// PUBLIC
// ===============================
const getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await FoodItem.findOne({
      _id: id,
      isActive: true,
      isAvailable: true,
    }).populate(
      "category",
      "name description image"
    );

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    // Make sure restaurant is publicly available
    const restaurant = await Restaurant.findOne({
      _id: foodItem.restaurant,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      foodItem,
    });
  } catch (error) {
    console.error("Get Food Item By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching food item",
    });
  }
};

// ===============================
// GET MY RESTAURANT FOOD ITEMS
// RESTAURANT OWNER ONLY
// ===============================
const getMyRestaurantFoodItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // ===============================
    // CHECK OWNERSHIP
    // ===============================
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

    const foodItems = await FoodItem.find({
      restaurant: restaurantId,
      isActive: true,
    })
      .populate("category", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foodItems.length,
      foodItems,
    });
  } catch (error) {
    console.error(
      "Get My Restaurant Food Items Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching your food items",
    });
  }
};

// ===============================
// UPDATE FOOD ITEM
// RESTAURANT OWNER ONLY
// ===============================
const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await FoodItem.findById(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    // ===============================
    // CHECK RESTAURANT OWNERSHIP
    // ===============================
    const restaurant = await Restaurant.findOne({
      _id: foodItem.restaurant,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to update this food item",
      });
    }

    const {
      name,
      description,
      category,
      price,
      discountPrice,
      image,
      isVeg,
      ingredients,
      preparationTime,
      isAvailable,
      isFeatured,
    } = req.body;

    // ===============================
    // CATEGORY VALIDATION
    // ===============================
    if (category !== undefined) {
      const existingCategory =
        await FoodCategory.findOne({
          _id: category,
          restaurant: foodItem.restaurant,
          isActive: true,
        });

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message:
            "Category not found or category does not belong to this restaurant",
        });
      }

      foodItem.category = category;
    }

    // ===============================
    // DISCOUNT VALIDATION
    // ===============================
    const finalPrice =
      price !== undefined ? Number(price) : foodItem.price;

    const finalDiscountPrice =
      discountPrice !== undefined
        ? discountPrice
        : foodItem.discountPrice;

    if (
      finalDiscountPrice !== null &&
      finalDiscountPrice !== undefined &&
      Number(finalDiscountPrice) >= finalPrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount price must be less than original price",
      });
    }

    // ===============================
    // UPDATE FIELDS
    // ===============================
    if (name !== undefined) {
      foodItem.name = name.trim();
    }

    if (description !== undefined) {
      foodItem.description = description;
    }

    if (price !== undefined) {
      foodItem.price = price;
    }

    if (discountPrice !== undefined) {
      foodItem.discountPrice = discountPrice;
    }

    if (image !== undefined) {
      foodItem.image = image;
    }

    if (isVeg !== undefined) {
      foodItem.isVeg = isVeg;
    }

    if (ingredients !== undefined) {
      foodItem.ingredients = ingredients;
    }

    if (preparationTime !== undefined) {
      foodItem.preparationTime = preparationTime;
    }

    if (isAvailable !== undefined) {
      foodItem.isAvailable = isAvailable;
    }

    if (isFeatured !== undefined) {
      foodItem.isFeatured = isFeatured;
    }

    await foodItem.save();

    res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      foodItem,
    });
  } catch (error) {
    console.error("Update Food Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating food item",
    });
  }
};

// ===============================
// DELETE FOOD ITEM
// RESTAURANT OWNER ONLY
// ===============================
const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await FoodItem.findById(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    // ===============================
    // CHECK RESTAURANT OWNERSHIP
    // ===============================
    const restaurant = await Restaurant.findOne({
      _id: foodItem.restaurant,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to delete this food item",
      });
    }

    // Soft delete
    foodItem.isActive = false;

    await foodItem.save();

    res.status(200).json({
      success: true,
      message: "Food item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Food Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting food item",
    });
  }
};

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  createFoodItem,
  getRestaurantFoodItems,
  getFoodItemById,
  getMyRestaurantFoodItems,
  updateFoodItem,
  deleteFoodItem,
};