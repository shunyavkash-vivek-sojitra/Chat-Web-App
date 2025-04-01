const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  username: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
