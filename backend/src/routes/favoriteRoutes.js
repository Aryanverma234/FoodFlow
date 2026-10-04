const express = require("express");

const {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} = require("../controllers/favoriteController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, addFavorite);

router.get("/", protect, getMyFavorites);

router.delete("/:foodItemId", protect, removeFavorite);

module.exports = router;