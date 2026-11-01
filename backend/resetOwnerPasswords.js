
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const ownerEmails = [
  "restaurant.test@example.com",
  "owner1@foodflow.com",
  "wokroll@foodflow.com",
];

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const password = "FoodFlow@123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.updateMany(
      {
        email: { $in: ownerEmails },
        role: "restaurant",
      },
      {
        $set: { password: hashedPassword },
      }
    );

    console.log("Matched owners:", result.matchedCount);
    console.log("Updated owners:", result.modifiedCount);

    if (result.matchedCount !== 3) {
      console.log("WARNING: All 3 owner accounts were not found.");
    } else {
      console.log("All 3 owner passwords updated successfully!");
    }
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

resetPasswords();
