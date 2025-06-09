// controllers/scribeController.js
require("dotenv").config();
const AWS            = require("aws-sdk");
const multer         = require("multer");
const ScribeSession  = require("../models/ScribeSession");

const upload = multer({ storage: multer.memoryStorage() });

AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

const BUCKET    = process.env.S3_BUCKET;      // ingest bucket name
const QUEUE_URL = process.env.SQS_QUEUE_URL;  // your SQS URL

// middleware to parse the "audio" field
exports.uploadAudio = upload.single("audio");

/**
 * POST /api/scribe
 * - Expects form-data: audio file, patient, appointment
 * - Uploads audio to S3, creates a ScribeSession, enqueues SQS
 */
exports.startScribe = async (req, res) => {
  try {
    // if auth is disabled, fall back to a passed-in provider field
    const providerId = req.user?.id || req.body.provider;
    const { patient, appointment } = req.body;

    if (!providerId || !req.file || !patient || !appointment) {
      return res
        .status(400)
        .json({ error: "provider, audio, patient, and appointment are required." });
    }

    // 1) Upload the audio to S3
    const key = `ingest/${providerId}/${Date.now()}_${req.file.originalname}`;
    await s3
      .putObject({
        Bucket:      BUCKET,
        Key:         key,
        Body:        req.file.buffer,
        ContentType: req.file.mimetype,
      })
      .promise();

    const audioUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 2) Create the session in MongoDB with the real audioUrl
    const session = await ScribeSession.create({
      provider:    providerId,
      patient,
      appointment,
      audioUrl,
      status:      "pending",
    });

    // 3) Enqueue for processing
    await sqs
      .sendMessage({
        QueueUrl:    QUEUE_URL,
        MessageBody: JSON.stringify({
          sessionId: session._id.toString(),
          s3Key:     key,
        }),
      })
      .promise();

    // 4) Respond to client
    return res.status(201).json({
      sessionId: session._id,
      audioUrl,
      status:    session.status,
    });
  } catch (err) {
    console.error("startScribe error:", err);
    return res.status(500).json({ error: "Failed to start scribe session." });
  }
};
