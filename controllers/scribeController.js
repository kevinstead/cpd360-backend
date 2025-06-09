// controllers/scribeController.js
require("dotenv").config();
const AWS           = require("aws-sdk");
const multer        = require("multer");
const ScribeSession = require("../models/ScribeSession");

const upload = multer({ storage: multer.memoryStorage() });

AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

const BUCKET    = process.env.S3_BUCKET;
const QUEUE_URL = process.env.SQS_QUEUE_URL;

exports.uploadAudio = upload.single("audio");

exports.startScribe = async (req, res) => {
  try {
    // if auth is disabled, use provider from form
    const providerId = req.user?.id || req.body.provider;
    const { patient, appointment } = req.body;

    if (!providerId || !req.file || !patient || !appointment) {
      return res.status(400).json({
        error: "provider, audio, patient, and appointment are required."
      });
    }

    // 1) Upload audio to S3
    const key = `ingest/${providerId}/${Date.now()}_${req.file.originalname}`;
    await s3.putObject({
      Bucket:      BUCKET,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();

    const audioUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 2) Create session with real audioUrl
    const session = await ScribeSession.create({
      provider:    providerId,
      patient,
      appointment,
      audioUrl,
      status:      "pending"
    });

    // 3) Enqueue the job
    await sqs.sendMessage({
      QueueUrl:    QUEUE_URL,
      MessageBody: JSON.stringify({ sessionId: session._id, s3Key: key })
    }).promise();

    // 4) Respond
    return res.status(201).json({
      sessionId: session._id,
      audioUrl,
      status:    session.status
    });
  } catch (err) {
    console.error("startScribe error:", err);
    return res.status(500).json({ error: "Failed to start scribe session." });
  }
};

exports.getScribe = async (req, res) => {
  try {
    const session = await ScribeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found." });
    return res.json(session);
  } catch (err) {
    console.error("getScribe error:", err);
    return res.status(500).json({ error: "Failed to fetch session." });
  }
};

exports.finalizeScribe = async (req, res) => {
  try {
    const { notesDraft, codeSuggestions } = req.body;
    const session = await ScribeSession.findByIdAndUpdate(
      req.params.id,
      { notesDraft, codeSuggestions, status: "ready" },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found." });
    return res.json({ success: true, session });
  } catch (err) {
    console.error("finalizeScribe error:", err);
    return res.status(500).json({ error: "Failed to finalize session." });
  }
};
