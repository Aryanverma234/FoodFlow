
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// =====================================
// CREATE RESTAURANT OWNER - ADMIN ONLY
// =====================================
const createRestaurantOwner = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const owner = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "restaurant",
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant owner account created successfully",
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        isActive: owner.isActive,
      },
    });
  } catch (error) {
    console.error("Create Restaurant Owner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating restaurant owner",
    });
  }
};

// =====================================
// GET ALL RESTAURANT OWNERS - ADMIN ONLY
// =====================================
const getAllRestaurantOwners = async (req, res) => {
  try {
    const owners = await User.find({
      role: "restaurant",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: owners.length,
      owners,
    });
  } catch (error) {
    console.error("Admin Get Restaurant Owners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching restaurant owners",
    });
  }
};

// =====================================
// GET ALL RESTAURANTS - ADMIN ONLY
// =====================================
const getAllAdminRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error("Admin Get Restaurants Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching restaurants",
    });
  }
};

// =====================================
// APPROVE RESTAURANT - ADMIN ONLY
// =====================================
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

    if (restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is already approved",
      });
    }

    restaurant.isApproved = true;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant approved successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Admin Approve Restaurant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while approving restaurant",
    });
  }
};

module.exports = {
  createRestaurantOwner,
  getAllRestaurantOwners,
  getAllAdminRestaurants,
  approveRestaurant,
};
