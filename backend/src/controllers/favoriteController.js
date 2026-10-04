const Favorite = require("../models/Favorite");
const FoodItem = require("../models/FoodItem");

const addFavorite = async (req, res) => {
  try {
    const { foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({
        success: false,
        message: "Food item is required",
      });
    }

    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      isActive: true,
    });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: req.user.userId,
      foodItem: foodItemId,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: "Food item is already in favorites",
      });
    }

    const favorite = await Favorite.create({
      user: req.user.userId,
      foodItem: foodItemId,
      restaurant: foodItem.restaurant,
    });

    const populatedFavorite = await Favorite.findById(
      favorite._id
    )
      .populate("foodItem", "name image price discountPrice rating")
      .populate("restaurant", "name logo rating");

    res.status(201).json({
      success: true,
      message: "Added to favorites successfully",
      favorite: populatedFavorite,
    });
  } catch (error) {
    console.error("Add Favorite Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Food item is already in favorites",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding favorite",
    });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({
      user: req.user.userId,
    })
      .populate("foodItem", "name image price discountPrice rating")
      .populate("restaurant", "name logo rating")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    console.error("Get Favorites Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching favorites",
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { foodItemId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user.userId,
      foodItem: foodItemId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed from favorites successfully",
    });
  } catch (error) {
    console.error("Remove Favorite Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while removing favorite",
    });
  }
};

module.exports = {
  addFavorite,
  getMyFavorites,
  removeFavorite,
};