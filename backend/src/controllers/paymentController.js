const Payment = require("../models/Payment");
const Order = require("../models/Order");

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
};