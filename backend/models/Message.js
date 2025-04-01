const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderID: { type: String, required: true },
  receiverID: { type: String },
  groupID: { type: String },
  senderUsername: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
