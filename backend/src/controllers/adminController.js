
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");

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

// =====================================
// GET ALL ORDERS - ADMIN ONLY
// =====================================
const getAllAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin Get Platform Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching platform orders",
    });
  }
};

// =====================================
// GET PLATFORM STATS - ADMIN ONLY
// =====================================
const getAdminStats = async (req, res) => {
  try {
    const [
      totalRestaurants,
      totalOwners,
      totalUsers,
      totalOrders,
      paidOrders,
      pendingApprovals,
    ] = await Promise.all([
      Restaurant.countDocuments(),
      User.countDocuments({ role: "restaurant" }),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments(),
      Order.find({ paymentStatus: "PAID" }, "total"),
      Restaurant.countDocuments({ isApproved: false }),
    ]);

    const totalRevenue = paidOrders.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalRestaurants,
        totalOwners,
        totalUsers,
        totalOrders,
        totalRevenue,
        pendingApprovals,
      },
    });
  } catch (error) {
    console.error("Admin Get Platform Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin stats",
    });
  }
};

module.exports = {
  getAllAdminOrders,
  getAdminStats,
  createRestaurantOwner,
  getAllRestaurantOwners,
  getAllAdminRestaurants,
  approveRestaurant,
};
