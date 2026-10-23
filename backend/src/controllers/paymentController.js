const Payment = require("../models/Payment");
const Order = require("../models/Order");


// Simulate a payment for college project demonstration
const simulateMockPayment = async (req, res) => {
  const session = await Order.startSession();

  try {
    const { orderId, outcome } = req.body;

    if (
      typeof orderId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(orderId) ||
      !["SUCCESS", "FAILED"].includes(outcome)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId and outcome (SUCCESS or FAILED) are required",
      });
    }

    let result;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.userId,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (order.paymentMethod !== "ONLINE") {
        const error = new Error(
          "Mock payment is only available for online orders"
        );
        error.statusCode = 400;
        throw error;
      }

      if (order.orderStatus === "CANCELLED") {
        const error = new Error("Cannot pay for a cancelled order");
        error.statusCode = 400;
        throw error;
      }

      if (order.paymentStatus !== "PENDING") {
        const error = new Error(
          "This order payment has already been processed"
        );
        error.statusCode = 400;
        throw error;
      }

      const payment = await Payment.findOne({
        order: order._id,
        user: req.user.userId,
      }).session(session);

      if (!payment) {
        const error = new Error("Payment record not found");
        error.statusCode = 404;
        throw error;
      }

      if (payment.status !== "PENDING") {
        const error = new Error("This payment has already been processed");
        error.statusCode = 400;
        throw error;
      }

      payment.status = outcome;
      payment.failureReason =
        outcome === "FAILED"
          ? "Mock payment failure for demonstration"
          : "";

      if (outcome === "SUCCESS") {
        payment.paidAt = new Date();
        order.paymentStatus = "PAID";
      } else {
        order.paymentStatus = "FAILED";
      }

      await payment.save({ session });
      await order.save({ session });

      result = {
        message:
          outcome === "SUCCESS"
            ? "Mock payment successful"
            : "Mock payment failed",
        payment: payment.toObject(),
        orderPaymentStatus: order.paymentStatus,
      };
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Mock Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while processing mock payment",
    });
  } finally {
    await session.endSession();
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