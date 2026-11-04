const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;

    if (!name || !username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({
      $or: [
        { email: String(email).toLowerCase() },
        { username: String(username).toLowerCase() },
        { phone: String(phone) },
      ],
    });
    if (exists) {
      return res.status(400).json({ message: "Email, username or phone already registered" });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({ name, username, email, phone, password: hashed });

    res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: user.name, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (user.isFrozen) {
      return res.status(403).json({ message: "Account is frozen. Contact admin." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        hasPin: !!user.transactionPin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;