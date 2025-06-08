// models/ScribeSession.js
const mongoose = require("mongoose");

const codeSuggestionSchema = new mongoose.Schema({
  code:        { type: String, required: true },
  description: { type: String },
  confidence:  { type: Number },  // 0–1 score
});

const scribeSessionSchema = new mongoose.Schema({
  provider:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patient:      { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  appointment:  { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  audioUrl:     { type: String, required: true },
  transcript:   { type: String },
  notesDraft:   { type: String },
  codeSuggestions: [codeSuggestionSchema],
  status:       { type: String, enum: ["pending","ready","error"], default: "pending" },
}, {
  timestamps: true,
});

module.exports = mongoose.model("ScribeSession", scribeSessionSchema);
