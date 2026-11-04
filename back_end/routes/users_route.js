const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -transactionPin");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch profile", error: err.message });
  }
});

// PUT /api/users/me  (only name and phone can change)
router.put("/me", auth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -transactionPin");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// POST /api/users/set-pin
router.post("/set-pin", auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!/^\d{4,6}$/.test(String(pin))) {
      return res.status(400).json({ message: "PIN must be 4 to 6 digits" });
    }
    const user = await User.findById(req.user.id);
    if (user.transactionPin) {
      return res.status(400).json({ message: "PIN already set" });
    }
    user.transactionPin = await bcrypt.hash(String(pin), 10);
    await user.save();
    res.json({ message: "Transaction PIN set" });
  } catch (err) {
    res.status(500).json({ message: "Could not set PIN", error: err.message });
  }
});

// GET /api/users/search?query=  (returns only name and username)
router.get("/search", auth, async (req, res) => {
  try {
    const q = String(req.query.query || "").trim().toLowerCase();
    if (q.length < 2) return res.json([]);

    const users = await User.find({
      username: { $regex: "^" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") },
      _id: { $ne: req.user.id },
    })
      .select("name username")
      .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

module.exports = router;