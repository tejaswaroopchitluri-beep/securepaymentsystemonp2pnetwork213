const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { appendBlock } = require("../utils/blockchain");

// POST /api/transactions/transfer
router.post("/transfer", auth, async (req, res) => {
  const { receiverUsername, pin, note, idempotencyKey } = req.body;
  const amount = Number(req.body.amount);

  if (!receiverUsername || !pin || !idempotencyKey) {
    return res.status(400).json({ message: "receiverUsername, pin and idempotencyKey are required" });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  // same key again = return the original result, don't pay twice
  const existing = await Transaction.findOne({ idempotencyKey: String(idempotencyKey) });
  if (existing) {
    return res.status(200).json({ message: "Duplicate request, transfer already processed", transaction: existing });
  }

  const session = await mongoose.startSession();
  try {
    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ message: "Sender not found" });
    if (sender.isFrozen) return res.status(403).json({ message: "Your account is frozen" });
    if (!sender.transactionPin) return res.status(400).json({ message: "Set your transaction PIN first" });
    if (!(await bcrypt.compare(String(pin), sender.transactionPin))) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    const receiver = await User.findOne({ username: String(receiverUsername).toLowerCase() });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (receiver.isFrozen) return res.status(400).json({ message: "Receiver account is unavailable" });
    if (receiver._id.equals(sender._id)) return res.status(400).json({ message: "Cannot send money to yourself" });

    let block;
    await session.withTransaction(async () => {
      // debit only if balance is enough (check + update in one atomic step)
      const debited = await User.findOneAndUpdate(
        { _id: sender._id, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { session }
      );
      if (!debited) throw new Error("INSUFFICIENT");

      await User.updateOne({ _id: receiver._id }, { $inc: { walletBalance: amount } }, { session });

      block = await appendBlock(
        {
          type: "transfer",
          senderId: sender._id,
          receiverId: receiver._id,
          amount,
          note: note || "",
          idempotencyKey: String(idempotencyKey),
          ipAddress: req.ip,
        },
        session
      );
    });

    res.status(201).json({
      message: "Transfer successful",
      transaction: { id: block._id, index: block.index, amount, to: receiver.username, hash: block.hash },
    });
  } catch (err) {
    if (err.message === "INSUFFICIENT") return res.status(400).json({ message: "Insufficient balance" });
    res.status(500).json({ message: "Transfer failed, no money was deducted", error: err.message });
  } finally {
    session.endSession();
  }
});

// GET /api/transactions  (own history only)
router.get("/", auth, async (req, res) => {
  try {
    const txs = await Transaction.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .sort({ index: -1 })
      .populate("senderId receiverId", "name username");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch history", error: err.message });
  }
});

// GET /api/transactions/:id  (only if you are part of it)
router.get("/:id", auth, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate("senderId receiverId", "name username");
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const uid = req.user.id;
    const isParty = [tx.senderId?._id, tx.receiverId?._id].some((x) => x && x.toString() === uid);
    if (!isParty) return res.status(403).json({ message: "Not allowed" });

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch transaction", error: err.message });
  }
});

module.exports = router;