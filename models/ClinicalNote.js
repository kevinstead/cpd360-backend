const mongoose = require('mongoose');

const ClinicalNoteSchema = new mongoose.Schema({
  jobId:         { type: String, required: true, unique: true },
  s3Key:         { type: String, required: true },
  s3ResultKey:   { type: String, required: true },
  transcript:    { type: String, required: true },
  codes:         { type: mongoose.Schema.Types.Mixed, required: true },
  processedAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClinicalNote', ClinicalNoteSchema);
