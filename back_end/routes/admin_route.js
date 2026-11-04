const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { verifyChain } = require("../utils/blockchain");

// GET /api/admin/verify-chain
router.get("/verify-chain", auth, isAdmin, async (req, res) => {
  try {
    res.json(await verifyChain());
  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

// GET /api/admin/transactions
router.get("/transactions", auth, isAdmin, async (req, res) => {
  try {
    res.json(await Transaction.find().sort({ index: -1 }));
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    res.json(await User.find().select("-password -transactionPin"));
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// PUT /api/admin/users/:id/freeze  (toggle freeze/unfreeze)
router.put("/users/:id/freeze", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isFrozen = !user.isFrozen;
    await user.save();
    res.json({ message: user.isFrozen ? "Account frozen" : "Account unfrozen" });
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

module.exports = router;