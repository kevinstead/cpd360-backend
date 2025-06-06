const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");

// Sample middleware to simulate authentication
// Replace with real middleware (e.g., JWT verify)
const authenticate = (req, res, next) => {
  // In real setup: extract user ID from token
  req.user = { id: "64a123abc123456789abcdef" }; // mock provider ID
  next();
};

// GET /api/appointments
router.get("/", authenticate, async (req, res) => {
  try {
    const appointments = await Appointment.find({ providerId: req.user.id });
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
