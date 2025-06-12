const Appointment = require("../models/Appointment");

// ─── Create a New Appointment ──────────────────────────────────────────────
exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      user: req.user.id,
      provider: req.body.provider || req.user.id
    });

    const saved = await appointment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create appointment",
      error: err.message
    });
  }
};

// ─── Get All Appointments (Admin or Provider) ──────────────────────────────
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching appointments",
      error: err.message
    });
  }
};

// ─── Get My Appointments ───────────────────────────────────────────────────
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching your appointments",
      error: err.message
    });
  }
};

// ─── Get Provider's Appointments ───────────────────────────────────────────
exports.getProviderAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = { provider: req.user.id };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching provider appointments",
      error: err.message
    });
  }
};

// ─── Update Appointment ────────────────────────────────────────────────────
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason, status } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { date, reason, status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Error updating appointment",
      error: err.message
    });
  }
};

// ─── Delete Appointment ────────────────────────────────────────────────────
exports.deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });

    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting appointment",
      error: err.message
    });
  }
};
