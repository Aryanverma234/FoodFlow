const Cart = require("../models/Cart");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
  try {
    const { foodItemId, quantity = 1 } = req.body;

   if (!foodItemId) {
  return res.status(400).json({
    success: false,
    message: "Food item is required",
  });
}

if (!mongoose.Types.ObjectId.isValid(foodItemId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid food item ID",
  });
}

const requestedQuantity = Number(quantity);
    const MAX_QUANTITY = 10;

    
    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > MAX_QUANTITY
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number between 1 and 10",
      });
    }

    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      isActive: true,
      isAvailable: true,
    });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found or unavailable",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: foodItem.restaurant,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or unavailable",
      });
    }

    let cart = await Cart.findOne({
      user: req.user.userId,
    });

    const itemPrice =
      foodItem.discountPrice ??
      foodItem.price;

    if (!cart) {
      cart = new Cart({
        user: req.user.userId,
        restaurant: foodItem.restaurant,
        items: [
          {
            foodItem: foodItem._id,
            name: foodItem.name,
            price: itemPrice,
            quantity: requestedQuantity,
            image: foodItem.image,
            restaurant: foodItem.restaurant,
            subtotal: itemPrice * requestedQuantity,
          },
        ],
      });

      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Item added to cart successfully",
        cart,
      });
    }

    if (
      cart.restaurant &&
      cart.restaurant.toString() !== foodItem.restaurant.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You can only add items from one restaurant at a time. Please clear your cart first.",
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.foodItem.toString() === foodItemId.toString()
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + requestedQuantity;

      if (newQuantity > MAX_QUANTITY) {
        return res.status(400).json({
          success: false,
          message: "Maximum 10 units of one item are allowed",
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.price = itemPrice;
      existingItem.name = foodItem.name;
      existingItem.image = foodItem.image;
      existingItem.subtotal =
        itemPrice * newQuantity;
    } else {
      cart.items.push({
        foodItem: foodItem._id,
        name: foodItem.name,
        price: itemPrice,
        quantity: requestedQuantity,
        image: foodItem.image,
        restaurant: foodItem.restaurant,
        subtotal: itemPrice * requestedQuantity,
      });
    }

    cart.restaurant = foodItem.restaurant;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding item to cart",
      error: error.message,
    });
  }
};



const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId
    })
      .populate(
        "restaurant",
        "name logo deliveryTime minimumOrder"
      )
      .populate(
        "items.foodItem",
        "name price discountPrice image isVeg isAvailable"
      );

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: null
      });
    }

    return res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching cart",
      error: error.message
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { foodItemId } = req.params;
    const { quantity } = req.body;
const requestedQuantity = Number(quantity);

if (
  quantity === undefined ||
  !Number.isInteger(requestedQuantity) ||
  requestedQuantity < 1 ||
  requestedQuantity > 10
) {
  return res.status(400).json({
    success: false,
    message: "Quantity must be a whole number between 1 and 10",
  });
}
     

    const cart = await Cart.findOne({
      user: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      (cartItem) =>
        cartItem.foodItem.toString() === foodItemId.toString()
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item not found in cart"
      });
    }

    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      isActive: true,
      isAvailable: true
    });

    if (!foodItem) {
      return res.status(400).json({
        success: false,
        message: "Food item is no longer available"
      });
    }
    item.quantity = requestedQuantity;

    item.price =
      foodItem.discountPrice ??
      foodItem.price;

    item.name = foodItem.name;
    item.image = foodItem.image;
    item.subtotal =
      item.price * item.quantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      cart
    });
  } catch (error) {
    console.error("UPDATE CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating cart item",
      error: error.message
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { foodItemId } = req.params;

    const cart = await Cart.findOne({
      user: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const itemExists = cart.items.some(
      (item) =>
        item.foodItem.toString() === foodItemId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Food item not found in cart"
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.foodItem.toString() !== foodItemId.toString()
    );

    if (cart.items.length === 0) {
      cart.restaurant = null;
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart
    });
  } catch (error) {
    console.error("REMOVE CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing item from cart",
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = [];
    cart.restaurant = null;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart
    });
  } catch (error) {
    console.error("CLEAR CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while clearing cart",
      error: error.message
    });
  }
};

module.exports = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeFromCart,
  clearCart
};