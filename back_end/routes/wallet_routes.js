const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");
const { appendBlock } = require("../utils/blockchain");

const validAmount = (a) => Number.isFinite(a) && a > 0 && a <= 100000;

// GET /api/wallet/balance
router.get("/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("walletBalance name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ name: user.name, balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch balance", error: err.message });
  }
});

// POST /api/wallet/deposit  (simulated top-up)
router.post("/deposit", auth, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!validAmount(amount)) return res.status(400).json({ message: "Invalid amount" });

  const session = await mongoose.startSession();
  try {
    let block;
    await session.withTransaction(async () => {
      await User.updateOne({ _id: req.user.id }, { $inc: { walletBalance: amount } }, { session });
      block = await appendBlock(
        { type: "deposit", receiverId: req.user.id, amount, ipAddress: req.ip },
        session
      );
    });
    const user = await User.findById(req.user.id).select("walletBalance");
    res.status(201).json({ message: "Money added", balance: user.walletBalance, hash: block.hash });
  } catch (err) {
    res.status(500).json({ message: "Deposit failed", error: err.message });
  } finally {
    session.endSession();
  }
});

// POST /api/wallet/withdraw  (needs PIN)
router.post("/withdraw", auth, async (req, res) => {
  const amount = Number(req.body.amount);
  const { pin } = req.body;
  if (!validAmount(amount)) return res.status(400).json({ message: "Invalid amount" });
  if (!pin) return res.status(400).json({ message: "Transaction PIN required" });

  const session = await mongoose.startSession();
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isFrozen) return res.status(403).json({ message: "Account is frozen" });
    if (!user.transactionPin) return res.status(400).json({ message: "Set your transaction PIN first" });
    if (!(await bcrypt.compare(String(pin), user.transactionPin))) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    let block;
    await session.withTransaction(async () => {
      const updated = await User.findOneAndUpdate(
        { _id: req.user.id, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true, session }
      );
      if (!updated) throw new Error("INSUFFICIENT");
      block = await appendBlock(
        { type: "withdrawal", senderId: req.user.id, amount, ipAddress: req.ip },
        session
      );
    });
    const fresh = await User.findById(req.user.id).select("walletBalance");
    res.json({ message: "Withdrawal successful", balance: fresh.walletBalance, hash: block.hash });
  } catch (err) {
    if (err.message === "INSUFFICIENT") return res.status(400).json({ message: "Insufficient balance" });
    res.status(500).json({ message: "Withdrawal failed", error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;