const mongoose = require("mongoose");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Restaurant = require("../models/Restaurant");
const Coupon = require("../models/Coupon");

const {
  createOrderNotification,
} = require("../services/notificationService");

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `FF-${timestamp}-${random}`;
};

// ============================================
// CREATE ORDER
// ============================================
const createOrder = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    let populatedOrder;

    await session.withTransaction(async () => {
      const {
        addressId,
        paymentMethod = "COD",
        couponCode,
      } = req.body;

      const fail = (status, message) => {
        const error = new Error(message);
        error.status = status;
        throw error;
      };

      // Validate address and payment method
      if (!addressId) {
        fail(400, "Delivery address is required");
      }

      if (!["COD", "ONLINE"].includes(paymentMethod)) {
        fail(400, "Invalid payment method");
      }

      // Find customer's active delivery address
      const address = await Address.findOne({
        _id: addressId,
        user: req.user.userId,
        isActive: true,
      }).session(session);

      if (!address) {
        fail(404, "Delivery address not found");
      }

      // Find customer's cart
      const cart = await Cart.findOne({
        user: req.user.userId,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        fail(400, "Your cart is empty");
      }

      // Validate restaurant
      const restaurant = await Restaurant.findOne({
        _id: cart.restaurant,
        isApproved: true,
        isActive: true,
      }).session(session);

      if (!restaurant) {
        fail(400, "Restaurant is unavailable");
      }

      let coupon = null;
      let couponDiscount = 0;

      // Validate coupon and calculate discount
      if (couponCode) {
        if (
          typeof couponCode !== "string" ||
          !couponCode.trim()
        ) {
          fail(400, "Invalid coupon code");
        }

        coupon = await Coupon.findOne({
          code: couponCode.trim().toUpperCase(),
          isActive: true,
          startDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        }).session(session);

        if (!coupon) {
          fail(400, "Invalid or expired coupon");
        }

        if (
          coupon.restaurant &&
          coupon.restaurant.toString() !==
            cart.restaurant.toString()
        ) {
          fail(
            400,
            "This coupon is not valid for this restaurant"
          );
        }

        if (cart.subtotal < coupon.minimumOrderAmount) {
          fail(
            400,
            "Minimum order amount for this coupon is " +
              coupon.minimumOrderAmount
          );
        }

        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          fail(
            400,
            "Coupon usage limit has been reached"
          );
        }

        if (coupon.discountType === "PERCENTAGE") {
          couponDiscount =
            (cart.subtotal * coupon.discountValue) / 100;

          if (
            coupon.maximumDiscount !== null &&
            couponDiscount > coupon.maximumDiscount
          ) {
            couponDiscount = coupon.maximumDiscount;
          }
        } else {
          couponDiscount = coupon.discountValue;
        }

        // Discount cannot exceed subtotal
        couponDiscount = Math.min(
          couponDiscount,
          cart.subtotal
        );
      }

      // Create order item snapshots
      const orderItems = cart.items.map((item) => ({
        foodItem: item.foodItem,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        subtotal: item.price * item.quantity,
      }));

      // Save delivery address snapshot
      const deliveryAddress = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        landmark: address.landmark || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || "India",
      };

      const totalDiscount =
        cart.discount + couponDiscount;

      const total = Math.max(
        0,
        cart.subtotal +
          cart.deliveryFee -
          totalDiscount
      );

      // Create order inside the transaction
      const [order] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            user: req.user.userId,
            restaurant: cart.restaurant,
            items: orderItems,
            deliveryAddress,
            subtotal: cart.subtotal,
            deliveryFee: cart.deliveryFee,
            discount: totalDiscount,
            total,
            paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PLACED",
            estimatedDeliveryTime:
              restaurant.deliveryTime || 30,
          },
        ],
        { session }
      );

      // Create payment record inside the transaction
      await Payment.create(
        [
          {
            order: order._id,
            user: req.user.userId,
            amount: order.total,
            currency: "INR",
            method:
              paymentMethod === "COD"
                ? "COD"
                : "RAZORPAY",
            status: "PENDING",
          },
        ],
        { session }
      );

      // Clear cart inside the transaction
      cart.items = [];
      cart.restaurant = null;
      cart.subtotal = 0;
      cart.deliveryFee = 0;
      cart.discount = 0;
      cart.total = 0;

      await cart.save({ session });

      // Update coupon usage inside the transaction
      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save({ session });
      }

      // Prepare order response
      populatedOrder = await Order.findById(order._id)
        .session(session)
        .populate(
          "restaurant",
          "name logo deliveryTime"
        )
        .populate(
          "user",
          "name email phone"
        );
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// ============================================
// GET MY ORDERS
// ============================================
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    })
      .populate("restaurant", "name logo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};

// ============================================
// GET ORDER BY ID
// ============================================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user.userId,
    })
      .populate(
        "restaurant",
        "name logo phone"
      )
      .populate(
        "items.foodItem",
        "name price image"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

// ============================================
// CANCEL ORDER
// ============================================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      cancellationReason = "Cancelled by customer",
    } = req.body;

    const order = await Order.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      ["DELIVERED", "CANCELLED"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled because it is already " +
          order.orderStatus.toLowerCase(),
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancellationReason = cancellationReason;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
    });
  }
};

// ============================================
// GET RESTAURANT ORDERS
// ============================================
const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

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

    const orders = await Order.find({
      restaurant: restaurantId,
    })
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "items.foodItem",
        "name image"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get Restaurant Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching restaurant orders",
    });
  }
};

// ============================================
// UPDATE ORDER STATUS
// ============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: order.restaurant,
      owner: req.user.userId,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to update this order",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be updated",
      });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Delivered order cannot be updated",
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    await createOrderNotification({
      userId: order.user._id || order.user,
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    });

    const updatedOrder = await Order.findById(order._id)
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "restaurant",
        "name logo deliveryTime"
      )
      .populate(
        "items.foodItem",
        "name image"
      );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating order status",
    });
  }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getRestaurantOrders,
};