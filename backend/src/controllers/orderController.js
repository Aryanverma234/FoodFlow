const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Restaurant = require("../models/Restaurant");
const Coupon = require("../models/Coupon");

const generateOrderNumber = () => {
const timestamp = Date.now().toString().slice(-8);
const random = Math.floor(1000 + Math.random() * 9000);

return "FF-" + timestamp + "-" + random;
};

const createOrder = async (req, res) => {
try {
const {
addressId,
paymentMethod = "COD",
 couponCode,
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
let coupon = null;
let couponDiscount = 0;

if (couponCode) {
  coupon = await Coupon.findOne({
    code: couponCode.trim().toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gte: new Date() },
  });

  if (!coupon) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired coupon",
    });
  }

  if (
    coupon.restaurant &&
    coupon.restaurant.toString() !== cart.restaurant.toString()
  ) {
    return res.status(400).json({
      success: false,
      message: "This coupon is not valid for this restaurant",
    });
  }

  if (cart.subtotal < coupon.minimumOrderAmount) {
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

  if (couponDiscount > cart.subtotal) {
    couponDiscount = cart.subtotal;
  }
}

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
 discount: cart.discount + couponDiscount,
total:
  cart.subtotal +
  cart.deliveryFee -
  (cart.discount + couponDiscount),
  paymentMethod,
  paymentStatus: "PENDING",
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
if (coupon) {
  coupon.usedCount += 1;
  await coupon.save();
}
const populatedOrder = await Order.findById(order._id)
  .populate(
    "restaurant",
    "name logo deliveryTime"
  )
  .populate(
    "user",
    "name email phone"
  );

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
order.cancellationReason =
  cancellationReason;

await order.save();

res.status(200).json({
  success: true,
  message: "Order cancelled successfully",
  order,
});

} catch (error) {
console.error(
"Cancel Order Error:",
error
);

res.status(500).json({
  success: false,
  message:
    "Server error while cancelling order",
});

}
};

const getRestaurantOrders = async (
req,
res
) => {
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

res.status(200).json({
  success: true,
  count: orders.length,
  orders,
});

} catch (error) {
console.error(
"Get Restaurant Orders Error:",
error
);

res.status(500).json({
  success: false,
  message:
    "Server error while fetching restaurant orders",
});

}
};
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

    const updatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("restaurant", "name logo deliveryTime")
      .populate("items.foodItem", "name image");

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
    });
  }
};
module.exports = {
createOrder,
getMyOrders,
getOrderById,
cancelOrder,
updateOrderStatus,
getRestaurantOrders,
};