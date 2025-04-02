const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  groupID: { type: String, required: true, unique: true },
  groupName: { type: String, required: true },
  members: [{ type: String, required: true }],
});

module.exports = mongoose.model("Group", GroupSchema);
