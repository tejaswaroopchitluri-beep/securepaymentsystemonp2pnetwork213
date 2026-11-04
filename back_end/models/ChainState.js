const mongoose = require("mongoose");

const GENESIS = "0".repeat(64);

const chainStateSchema = new mongoose.Schema({
  _id: { type: String, default: "main" },
  height: { type: Number, default: 0 },
  lastHash: { type: String, default: GENESIS },
});

module.exports = mongoose.model("ChainState", chainStateSchema);
module.exports.GENESIS = GENESIS;