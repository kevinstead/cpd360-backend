const express       = require('express');
const AWS           = require('aws-sdk');
const multer        = require('multer');
const { v4: uuid }  = require('uuid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

// Environment variables
const S3_BUCKET         = process.env.S3_BUCKET;
const S3_RESULTS_BUCKET = process.env.S3_RESULTS_BUCKET;
const SQS_QUEUE_URL     = process.env.SQS_QUEUE_URL;

/**
 * @route   POST /api/scribe/submit
 * @desc    Uploads audio to S3 and enqueues a job in SQS
 * @field   audio (file)
 */
router.post('/submit', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // 1. Upload to ingest bucket
    const key = `ingest/${uuid()}_${req.file.originalname}`;
    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }).promise();

    // 2. Push message to SQS
    const messageBody = JSON.stringify({ s3Key: key, timestamp: Date.now() });
    await sqs.sendMessage({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: messageBody,
    }).promise();

    // 3. Respond with job ID
    res.json({ jobId: key });
  } catch (err) {
    console.error('[/api/scribe/submit] error:', err);
    res.status(500).json({ error: 'Failed to submit audio for processing' });
  }
});

/**
 * @route   GET /api/scribe/status/:jobId
 * @desc    Checks if the results file exists in S3_RESULTS_BUCKET
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    // derive the results key from the ingest key
    const resultKey = req.params.jobId.replace('ingest/', 'results/');

    // headObject will succeed if file exists
    await s3.headObject({
      Bucket: S3_RESULTS_BUCKET,
      Key: resultKey,
    }).promise();

    return res.json({ status: 'completed', resultKey });
  } catch (err) {
    if (err.code === 'NotFound') {
      return res.json({ status: 'pending' });
    }
    console.error('[/api/scribe/status] error:', err);
    res.status(500).json({ error: 'Failed to check job status' });
  }
});

module.exports = router;


