const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true },
  prevHash: { type: String, required: true },
  hash: { type: String, required: true },
  type: { type: String, enum: ["transfer", "deposit", "withdrawal"], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  amount: { type: Number, required: true },
  note: { type: String, default: "" },
  status: { type: String, default: "success" },
  idempotencyKey: { type: String, unique: true, sparse: true },
  ipAddress: String,
  timestamp: { type: Date, required: true },
});

module.exports = mongoose.model("Transaction", transactionSchema);