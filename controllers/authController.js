// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // 1) Check for duplicate email
    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // 2) Hash password
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // 3) Create user with explicit role
    const newUser = new User({
      name,
      email,
      password: hashed,
      role: role || "patient"
    });
    await newUser.save();

    // 🔍 Log to verify
    console.log(`✅ Registered new user "${name}" with role:`, newUser.role);

    // 4) Build & sign JWT
    const payload     = { id: newUser._id, role: newUser.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    // 5) Respond with user info *including* role
    return res.status(201).json({
      token: accessToken,
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
  role: user.role
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
