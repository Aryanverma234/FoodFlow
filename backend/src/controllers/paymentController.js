const Payment = require("../models/Payment");
const Order = require("../models/Order");

// Simulate a payment for college project demonstration
const simulateMockPayment = async (req, res) => {
  try {
    const { orderId, outcome } = req.body;

    if (!orderId || !["SUCCESS", "FAILED"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId and outcome (SUCCESS or FAILED) are required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "Mock payment is only available for online orders",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for a cancelled order",
      });
    }

    const payment = await Payment.findOne({
      order: order._id,
      user: req.user.userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This payment has already been processed",
      });
    }

    payment.status = outcome;
    payment.failureReason =
      outcome === "FAILED" ? "Mock payment failure for demonstration" : "";

    if (outcome === "SUCCESS") {
      payment.paidAt = new Date();
      order.paymentStatus = "PAID";
    } else {
      order.paymentStatus = "FAILED";
    }

    await payment.save();
    await order.save();

    return res.status(200).json({
      success: true,
      message:
        outcome === "SUCCESS"
          ? "Mock payment successful"
          : "Mock payment failed",
      payment,
      orderPaymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("Mock Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while processing mock payment",
    });
  }
};


// Get payments belonging to the logged-in customer
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user.userId,
    })
      .populate("order", "orderNumber total orderStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get My Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
    });
  }
};

// Get payment details for one of the customer's orders
const getPaymentByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = await Payment.findOne({
      order: order._id,
      user: req.user.userId,
    }).populate("order", "orderNumber total orderStatus");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this order",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get Payment By Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching payment",
    });
  }
};

module.exports = {
  getMyPayments,
  getPaymentByOrder,
  simulateMockPayment,
};