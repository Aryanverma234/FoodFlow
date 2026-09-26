const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes"); 
const restaurantRoutes = require("./routes/restaurantRoutes");
const foodCategoryRoutes = require("./routes/foodCategoryRoutes");
const foodItemRoutes = require("./routes/foodItemRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", limiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/categories", foodCategoryRoutes);
app.use("/api/food-items", foodItemRoutes);
app.use("/api/cart", cartRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FoodFlow API is running 🚀",
  });
});

module.exports = app;
