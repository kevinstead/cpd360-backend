const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Register User ──────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "patient"
    });

    const payload = {
      id: newUser._id,
      role: newUser.role // 🔥 include role in token
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

// ─── Login User ─────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const payload = {
      id: user._id,
      role: user.role // 🔥 include role in token
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
};
