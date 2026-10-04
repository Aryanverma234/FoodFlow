const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
      index: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index(
  {
    user: 1,
    foodItem: 1,
  },
  {
    unique: true,
  }
);

favoriteSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Favorite", favoriteSchema);