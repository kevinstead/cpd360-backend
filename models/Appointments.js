const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, required: true },
  date: { type: Date, required: true },
  reason: { type: String }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
