require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing in .env file");
  process.exit(1);
}

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 FoodFlow Server running on port ${PORT}`);
  });
};

startServer();