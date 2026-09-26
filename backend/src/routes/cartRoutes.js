const express = require("express");

const {
  addToCart,
  getMyCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require("../controllers/cartController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyCart);

router.post("/", protect, addToCart);

router.patch("/item/:foodItemId", protect, updateCartItem);

router.delete("/item/:foodItemId", protect, removeFromCart);

router.delete("/clear", protect, clearCart);

module.exports = router;