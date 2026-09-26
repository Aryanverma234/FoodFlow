const Restaurant = require("../models/Restaurant");

// ===============================
// CREATE RESTAURANT
// ===============================
const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      address,
      cuisine,
      deliveryTime,
      minimumOrder,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name is required",
      });
    }

    const restaurant = await Restaurant.create({
      name,
      description,
      owner: req.user.userId,
      phone,
      email,
      address,
      cuisine,
      deliveryTime,
      minimumOrder,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Create Restaurant Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating restaurant",
    });
  }
};

// ===============================
// GET ALL APPROVED RESTAURANTS
// PUBLIC
// ===============================
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      isApproved: true,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error("Get Restaurants Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching restaurants",
    });
  }
};

// ===============================
// GET RESTAURANT BY ID
// PUBLIC
// ===============================
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: id,
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
      restaurant,
    });
  } catch (error) {
    console.error("Get Restaurant By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching restaurant",
    });
  }
};

// ===============================
// GET MY RESTAURANTS
// RESTAURANT OWNER ONLY
// ===============================
const getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      owner: req.user.userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error("Get My Restaurants Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching your restaurants",
    });
  }
};

// ===============================
// APPROVE RESTAURANT
// ADMIN ONLY
// ===============================
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.isApproved = true;

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Restaurant approved successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Approve Restaurant Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while approving restaurant",
    });
  }
};

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  getMyRestaurants,
  approveRestaurant,
};