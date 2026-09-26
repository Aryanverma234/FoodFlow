const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodCategory",
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    image: {
      type: String,
      default: "",
    },

    isVeg: {
      type: Boolean,
      default: true,
    },

    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],

    preparationTime: {
      type: Number,
      default: 20,
      min: 1,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

foodItemSchema.index({
  restaurant: 1,
  category: 1,
});

foodItemSchema.index({
  restaurant: 1,
  isActive: 1,
  isAvailable: 1,
});

foodItemSchema.index({
  restaurant: 1,
  isFeatured: 1,
});

foodItemSchema.pre("save", function () {
  if (
    this.discountPrice !== null &&
    this.discountPrice !== undefined &&
    this.discountPrice >= this.price
  ) {
    throw new Error(
      "Discount price must be less than the original price"
    );
  }
});

module.exports = mongoose.model("FoodItem", foodItemSchema);