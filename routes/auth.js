// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // 1) Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // 2) Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3) Create new user with explicit role
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "patient"
    });
    await newUser.save();

    // 4) Build & sign JWT including role
    const payload = { id: newUser._id, role: newUser.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    console.log(`Registered ${newUser.email} as ${newUser.role}`);

    // 5) Respond with token and user info
    return res.status(201).json({
      token,
      user: {
        id:    newUser._id,
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1) Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // 2) Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // 3) Build & sign JWT with role
    const payload = { id: user._id, role: user.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // 4) Respond with token and user info
    return res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
