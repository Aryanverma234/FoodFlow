const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      enum: ["INR"],
    },

    method: {
      type: String,
      enum: ["COD", "RAZORPAY"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUND_PENDING",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    providerOrderId: {
      type: String,
      default: null,
      sparse: true,
    },

    providerPaymentId: {
      type: String,
      default: null,
      sparse: true,
    },

    providerSignature: {
      type: String,
      default: null,
      select: false,
    },

    failureReason: {
      type: String,
      default: "",
      maxlength: 500,
    },

    refundId: {
      type: String,
      default: null,
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  user: 1,
  createdAt: -1,
});

paymentSchema.index(
  { providerPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerPaymentId: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("Payment", paymentSchema);