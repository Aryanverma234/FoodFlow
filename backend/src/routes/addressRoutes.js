const express = require("express");

const {
  addAddress,
  getMyAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyAddresses);

router.post("/", protect, addAddress);

router.patch("/:id", protect, updateAddress);

router.delete("/:id", protect, deleteAddress);

router.patch(
  "/:id/default",
  protect,
  setDefaultAddress
);

module.exports = router;