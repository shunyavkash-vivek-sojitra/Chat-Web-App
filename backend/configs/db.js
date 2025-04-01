require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB Connection
const dbconnect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = dbconnect;
