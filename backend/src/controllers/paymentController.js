const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (
      typeof orderId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(orderId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid orderId is required",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
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
        message: "Razorpay is only available for online orders",
      });
    }

    if (
      order.orderStatus === "CANCELLED" ||
      order.paymentStatus !== "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order is not eligible for payment",
      });
    }

    const payment = await Payment.findOne({
      order: order._id,
      user: req.user.userId,
    });

    if (!payment || payment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "A pending payment record is required",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        customerId: req.user.userId.toString(),
      },
    });

    payment.providerOrderId = razorpayOrder.id;
    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create Razorpay order",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate required fields
    if (
      typeof orderId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(orderId) ||
      typeof razorpay_order_id !== "string" ||
      !/^order_[a-zA-Z0-9]+$/.test(razorpay_order_id) ||
      typeof razorpay_payment_id !== "string" ||
      !/^pay_[a-zA-Z0-9]+$/.test(razorpay_payment_id) ||
      typeof razorpay_signature !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    // Find only the logged-in user's order
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

    if (
      order.paymentMethod !== "ONLINE" ||
      order.orderStatus === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order is not eligible for online payment",
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

    // Prevent replaying a successful payment verification
    if (
      payment.status === "SUCCESS" &&
      order.paymentStatus === "PAID" &&
      payment.providerOrderId === razorpay_order_id &&
      payment.providerPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        paymentStatus: payment.status,
        orderStatus: order.paymentStatus,
      });
    }

    if (
      payment.status !== "PENDING" ||
      order.paymentStatus !== "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not pending",
      });
    }

    // Use the provider order ID saved on our server.
    if (
      !payment.providerOrderId ||
      payment.providerOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch",
      });
    }

    // Verify Razorpay's HMAC SHA-256 signature.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${payment.providerOrderId}|${razorpay_payment_id}`)
      .digest();

    const receivedSignature = Buffer.from(razorpay_signature, "hex");

    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Save payment and order together in a MongoDB transaction.
    const session = await Order.startSession();

    try {
      await session.withTransaction(async () => {
        const currentPayment = await Payment.findOne({
          _id: payment._id,
          order: order._id,
          user: req.user.userId,
          status: "PENDING",
          providerOrderId: razorpay_order_id,
        }).session(session);

        const currentOrder = await Order.findOne({
          _id: order._id,
          user: req.user.userId,
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
          orderStatus: { $ne: "CANCELLED" },
        }).session(session);

        if (!currentPayment || !currentOrder) {
          const error = new Error("Payment state changed; verify status");
          error.statusCode = 409;
          throw error;
        }

        currentPayment.status = "SUCCESS";
        currentPayment.providerPaymentId = razorpay_payment_id;
        currentPayment.providerSignature = razorpay_signature;
        currentPayment.paidAt = new Date();

        currentOrder.paymentStatus = "PAID";

        await currentPayment.save({ session });
        await currentOrder.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentStatus: "SUCCESS",
      orderPaymentStatus: "PAID",
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // Do not log secrets, signatures, or full payment payloads.
    console.error("Verify Razorpay Payment Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

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
  createRazorpayOrder,
  verifyRazorpayPayment,
};