const Appointment = require("../models/Appointment");

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      user: req.user.id // from auth middleware
    });
    const saved = await appointment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to create appointment", error: err.message });
  }
};

// Get all appointments (provider or admin can access all)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching appointments", error: err.message });
  }
};

// Get appointments by logged-in user
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your appointments", error: err.message });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating appointment", error: err.message });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting appointment", error: err.message });
  }
};
