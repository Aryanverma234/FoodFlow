const Coupon = require("../models/Coupon");
const Restaurant = require("../models/Restaurant");

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      restaurant,
      usageLimit,
      startDate,
      expiryDate,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount value, start date and expiry date are required",
      });
    }

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (Number(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "PERCENTAGE" &&
      Number(discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100",
      });
    }

    if (
      new Date(expiryDate) <= new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expiry date must be after start date",
      });
    }

    if (restaurant) {
      const existingRestaurant =
        await Restaurant.findOne({
          _id: restaurant,
          owner: req.user.userId,
          isActive: true,
        });

      if (!existingRestaurant) {
        return res.status(403).json({
          success: false,
          message:
            "You don't have permission to create coupons for this restaurant",
        });
      }
    }

    const existingCoupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description,
      discountType,
      discountValue,
      minimumOrderAmount:
        minimumOrderAmount || 0,
      maximumDiscount:
        maximumDiscount ?? null,
      restaurant: restaurant || null,
      usageLimit: usageLimit ?? null,
      startDate,
      expiryDate,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating coupon",
    });
  }
};

const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $or: [
        { restaurant: null },
        { restaurant: req.query.restaurantId },
      ],
    })
      .populate(
        "restaurant",
        "name logo"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get Active Coupons Error:", error);

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching coupons",
    });
  }
};

const getMyCoupons = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      owner: req.user.userId,
      isActive: true,
    }).select("_id");

    const restaurantIds = restaurants.map(
      (restaurant) => restaurant._id
    );

    const coupons = await Coupon.find({
      restaurant: { $in: restaurantIds },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get My Coupons Error:", error);

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching your coupons",
    });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const {
      code,
      orderAmount,
      restaurantId,
    } = req.body;

    if (!code || orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code and order amount are required",
      });
    }

    const now = new Date();

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    if (
      coupon.restaurant &&
      (!restaurantId ||
        coupon.restaurant.toString() !==
          restaurantId.toString())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This coupon is not valid for this restaurant",
      });
    }

    if (
      Number(orderAmount) <
      coupon.minimumOrderAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum order amount for this coupon is " +
          coupon.minimumOrderAmount,
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit has been reached",
      });
    }

    let discount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discount =
        (Number(orderAmount) *
          coupon.discountValue) /
        100;

      if (
        coupon.maximumDiscount !== null &&
        discount > coupon.maximumDiscount
      ) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    if (discount > Number(orderAmount)) {
      discount = Number(orderAmount);
    }

    const finalAmount =
      Number(orderAmount) - discount;

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Validate Coupon Error:", error);

    res.status(500).json({
      success: false,
      message:
        "Server error while validating coupon",
    });
  }
};

module.exports = {
  createCoupon,
  getActiveCoupons,
  getMyCoupons,
  validateCoupon,
};