// controllers/scribeController.js
const ScribeSession = require("../models/ScribeSession");

// POST /api/scribe
exports.startScribe = async (req, res) => {
  // TODO: handle file upload, save session with status="pending"
  res.status(201).json({ message: "Scribe session started" });
};

// GET /api/scribe/:id
exports.getScribe = async (req, res) => {
  // TODO: fetch session by id and return transcript, draft, codes
  res.json({ /* ... */ });
};

// POST /api/scribe/:id/finalize
exports.finalizeScribe = async (req, res) => {
  // TODO: save finalized notes & codes
  res.json({ success: true });
};
