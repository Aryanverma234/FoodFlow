const Notification = require("../models/Notification");

const createNotification = async ({
  userId,
  type,
  title,
  message,
  orderId = null,
}) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      order: orderId,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);
    return null;
  }
};

const createOrderNotification = async ({
  userId,
  orderId,
  orderNumber,
  orderStatus,
}) => {
  const notificationMap = {
    CONFIRMED: {
      type: "ORDER_CONFIRMED",
      title: "Order Confirmed",
      message:
        "Your order " +
        orderNumber +
        " has been confirmed by the restaurant.",
    },

    PREPARING: {
      type: "ORDER_PREPARING",
      title: "Order Being Prepared",
      message:
        "Your order " +
        orderNumber +
        " is now being prepared.",
    },

    READY: {
      type: "ORDER_READY",
      title: "Order Ready",
      message:
        "Your order " +
        orderNumber +
        " is ready for pickup/delivery.",
    },

    OUT_FOR_DELIVERY: {
      type: "ORDER_OUT_FOR_DELIVERY",
      title: "Order Out for Delivery",
      message:
        "Your order " +
        orderNumber +
        " is out for delivery.",
    },

    DELIVERED: {
      type: "ORDER_DELIVERED",
      title: "Order Delivered",
      message:
        "Your order " +
        orderNumber +
        " has been delivered. Enjoy your meal!",
    },

    CANCELLED: {
      type: "ORDER_CANCELLED",
      title: "Order Cancelled",
      message:
        "Your order " +
        orderNumber +
        " has been cancelled.",
    },
  };

  const notification = notificationMap[orderStatus];

  if (!notification) {
    return null;
  }

  return createNotification({
    userId,
    orderId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
  });
};

module.exports = {
  createNotification,
  createOrderNotification,
};