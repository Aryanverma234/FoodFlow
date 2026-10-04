const Review = require("../models/Review");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");

const createReview = async (req, res) => {
  try {
    const {
      orderId,
      foodItemId,
      rating,
      comment = "",
    } = req.body;

    if (!orderId || !foodItemId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Order, food item and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
      orderStatus: "DELIVERED",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Review can only be submitted for your delivered order",
      });
    }

    const orderedItem = order.items.find(
      (item) =>
        item.foodItem &&
        item.foodItem.toString() === foodItemId.toString()
    );

    if (!orderedItem) {
      return res.status(400).json({
        success: false,
        message: "This food item was not part of the order",
      });
    }

    const existingReview = await Review.findOne({
      user: req.user.userId,
      order: orderId,
      foodItem: foodItemId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this food item",
      });
    }

    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      restaurant: order.restaurant,
      isActive: true,
    });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const review = await Review.create({
      user: req.user.userId,
      restaurant: order.restaurant,
      foodItem: foodItemId,
      order: orderId,
      rating: numericRating,
      comment: comment.trim(),
    });

    const newTotalReviews = foodItem.totalReviews + 1;

    foodItem.rating =
      ((foodItem.rating * foodItem.totalReviews) +
        numericRating) /
      newTotalReviews;

    foodItem.totalReviews = newTotalReviews;

    await foodItem.save();

    const restaurantFoodItems = await FoodItem.find({
      restaurant: order.restaurant,
      isActive: true,
      totalReviews: { $gt: 0 },
    });

    let totalRating = 0;
    let totalReviews = 0;

    restaurantFoodItems.forEach((item) => {
      totalRating += item.rating * item.totalReviews;
      totalReviews += item.totalReviews;
    });

    const restaurant = await Restaurant.findById(
      order.restaurant
    );

    if (restaurant) {
      restaurant.rating =
        totalReviews > 0
          ? totalRating / totalReviews
          : 0;

      restaurant.totalReviews = totalReviews;

      await restaurant.save();
    }

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name avatar")
      .populate("foodItem", "name image price")
      .populate("restaurant", "name logo");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Create Review Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this food item",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating review",
    });
  }
};

module.exports = {
  createReview,
};