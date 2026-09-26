const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Restaurant = require("../models/Restaurant");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `FF-${timestamp}-${random}`;
};

const createOrder = async (req, res) => {
  try {
    const {
      addressId,
      paymentMethod = "COD",
    } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: req.user.userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: cart.restaurant,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is unavailable",
      });
    }

    const orderItems = cart.items.map((item) => ({
      foodItem: item.foodItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      subtotal: item.price * item.quantity,
    }));

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

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user.userId,
      restaurant: cart.restaurant,
      items: orderItems,
      deliveryAddress,
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      discount: cart.discount,
      total: cart.total,
      paymentMethod,
      paymentStatus:
        paymentMethod === "COD" ? "PENDING" : "PENDING",
      orderStatus: "PLACED",
      estimatedDeliveryTime:
        restaurant.deliveryTime || 30,
    });

    cart.items = [];
    cart.restaurant = null;
    cart.subtotal = 0;
    cart.deliveryFee = 0;
    cart.discount = 0;
    cart.total = 0;

    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("restaurant", "name logo deliveryTime")
      .populate("user", "name email phone");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    })
      .populate("restaurant", "name logo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user.userId,
    })
      .populate("restaurant", "name logo phone")
      .populate("items.foodItem", "name price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason = "Cancelled by customer" } =
      req.body;

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
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}`,
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancellationReason = cancellationReason;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};