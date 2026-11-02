const mongoose = require("mongoose");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Restaurant = require("../models/Restaurant");
const Coupon = require("../models/Coupon");
const FoodItem = require("../models/FoodItem");

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

      // Fetch fresh food item details from database
const foodItemIds = cart.items.map((item) => item.foodItem);

const freshFoodItems = await FoodItem.find({
  _id: { $in: foodItemIds },
  restaurant: cart.restaurant,
  isActive: true,
  isAvailable: true,
}).session(session);

if (freshFoodItems.length !== cart.items.length) {
  fail(
    400,
    "One or more food items are unavailable. Please refresh your cart."
  );
}

const foodItemsMap = new Map(
  freshFoodItems.map((item) => [
    item._id.toString(),
    item,
  ])
);

let freshSubtotal = 0;

const orderItems = cart.items.map((cartItem) => {
  if (
    !Number.isInteger(cartItem.quantity) ||
    cartItem.quantity < 1
  ) {
    fail(400, "Invalid item quantity");
  }

  const foodItem = foodItemsMap.get(
    cartItem.foodItem.toString()
  );

  if (!foodItem) {
    fail(400, "Food item is unavailable");
  }

  const currentPrice =
    foodItem.discountPrice ?? foodItem.price;

  const itemSubtotal =
    currentPrice * cartItem.quantity;

  freshSubtotal += itemSubtotal;

  return {
    foodItem: foodItem._id,
    name: foodItem.name,
    price: currentPrice,
    quantity: cartItem.quantity,
    image: foodItem.image,
    subtotal: itemSubtotal,
  };
});

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

        if (freshSubtotal < coupon.minimumOrderAmount) {
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
            (freshSubtotal * coupon.discountValue) / 100;

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
           freshSubtotal
       );
      }

     
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

   const totalDiscount = couponDiscount;

const deliveryFee = 0;

const total = Math.max(
  0,
  freshSubtotal + deliveryFee - totalDiscount
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
            subtotal: freshSubtotal,
            deliveryFee: deliveryFee,
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

const cancelOrder = async (req, res) => {
  let session;

  try {
    const { id } = req.params;

    const {
      cancellationReason = "Cancelled by customer",
    } = req.body;

    session = await mongoose.startSession();

    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        user: req.user.userId,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      // Only PLACED and CONFIRMED orders can be cancelled
      if (!["PLACED", "CONFIRMED"].includes(order.orderStatus)) {
        const error = new Error(
          "Order can only be cancelled before preparation starts"
        );
        error.statusCode = 400;
        throw error;
      }

      // Find payment record
      const payment = await Payment.findOne({
        order: order._id,
        user: req.user.userId,
      }).session(session);

      // Paid online orders require a refund
      if (
        order.paymentMethod === "ONLINE" &&
        order.paymentStatus === "PAID"
      ) {
        if (!payment || payment.status !== "SUCCESS") {
          const error = new Error(
            "Payment record not found. Please contact support."
          );
          error.statusCode = 400;
          throw error;
        }

        payment.status = "REFUND_PENDING";
        await payment.save({ session });

        order.paymentStatus = "REFUND_PENDING";
      }

      order.orderStatus = "CANCELLED";
      order.cancellationReason = cancellationReason;

      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error while cancelling order",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
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
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedTransitions = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const validStatuses = Object.values(allowedTransitions).flat();

if (!validStatuses.includes(orderStatus)) {
  return res.status(400).json({
    success: false,
    message: "Invalid order status",
  });
}

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      const restaurant = await Restaurant.findOne({
        _id: order.restaurant,
        owner: req.user.userId,
      }).session(session);

      if (!restaurant) {
        const error = new Error(
          "You are not authorized to update this order"
        );
        error.statusCode = 403;
        throw error;
      }

      if (order.orderStatus === "CANCELLED") {
        const error = new Error(
          "Cancelled order cannot be updated"
        );
        error.statusCode = 400;
        throw error;
      }

      if (order.orderStatus === "DELIVERED") {
        const error = new Error(
          "Delivered order cannot be updated"
        );
        error.statusCode = 400;
        throw error;
      }
      const nextStatuses =
  allowedTransitions[order.orderStatus] || [];

if (!nextStatuses.includes(orderStatus)) {
  const error = new Error(
    `Cannot change order status from ${order.orderStatus} to ${orderStatus}`
  );

  error.statusCode = 400;
  throw error;
}

      order.orderStatus = orderStatus;

      if (orderStatus === "CANCELLED") {
  order.cancellationReason =
    req.body.cancellationReason || "Cancelled by restaurant";

  // Handle refund for paid online orders
  if (
    order.paymentMethod === "ONLINE" &&
    order.paymentStatus === "PAID"
  ) {
    const payment = await Payment.findOne({
      order: order._id,
      user: order.user,
    }).session(session);

    if (!payment || payment.status !== "SUCCESS") {
      const error = new Error(
        "Payment record not found. Please contact support."
      );
      error.statusCode = 400;
      throw error;
    }

    payment.status = "REFUND_PENDING";
    await payment.save({ session });

    order.paymentStatus = "REFUND_PENDING";
  }
}

      // COD cash received when order is marked DELIVERED
      if (
        orderStatus === "DELIVERED" &&
        order.paymentMethod === "COD"
      ) {
        const payment = await Payment.findOne({
          order: order._id,
          method: "COD",
        }).session(session);

        if (!payment) {
          const error = new Error(
            "COD payment record not found"
          );
          error.statusCode = 404;
          throw error;
        }

        payment.status = "SUCCESS";
        payment.paidAt = new Date();

        await payment.save({ session });

        order.paymentStatus = "PAID";
      }

      await order.save({ session });

      updatedOrder = order;
    });

    // Create notification after successful transaction
    await createOrderNotification(
      updatedOrder,
      updatedOrder.orderStatus
    );

    const populatedOrder = await Order.findById(
      updatedOrder._id
    )
      .populate("user", "name email phone")
      .populate("restaurant", "name");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  } finally {
    await session.endSession();
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