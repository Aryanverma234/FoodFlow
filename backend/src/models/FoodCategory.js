const mongoose = require("mongoose");

const foodCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Same category name should not be duplicated
// inside the same restaurant.
foodCategorySchema.index(
  { restaurant: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "FoodCategory",
  foodCategorySchema
);