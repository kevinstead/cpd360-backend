const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register User
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "patient"
    });

    await newUser.save();

    // 🔍 Confirm newUser.role exists
    console.log("✅ Created user with role:", newUser.role);

    const payload = {
      id: newUser._id,
      role: newUser.role
    };

    console.log("✅ JWT Payload:", payload);

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.status(201).json({
      token: accessToken,
      role: newUser.role,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



// Login User
// authController.js

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1) find user
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  // 2) check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  // 3) build payload with role!
  const payload = {
    id:   user._id,
    role: user.role     // <-- include role here
  };

  // 4) sign token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  // 5) return token (and optionally user info)
  res.status(200).json({
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role   // <-- handy if you want it outside the token too
    }
  });
};

module.exports = {
  registerUser,
  loginUser
};
