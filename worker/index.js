// worker/index.js
require('dotenv').config();
const AWS       = require('aws-sdk');
const fs        = require('fs');
const path      = require('path');
const mongoose  = require('mongoose');
const OpenAI    = require('openai');

const ScribeSession = require('../models/ScribeSession');
const ClinicalNote  = require('../models/ClinicalNote');

// ─── AWS CONFIG ────────────────────────────────────────────────────────────────
AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

// ─── OPENAI CONFIG ─────────────────────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ─── MONGO CONNECT ─────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Worker: MongoDB connected'))
  .catch(err => console.error('Worker: MongoDB error:', err));

/**
 * process a single SQS message: download audio, transcribe, auto-code,
 * save to ClinicalNote, update ScribeSession, upload JSON, delete message
 */
async function processMessage(msg) {
  const { sessionId, s3Key } = JSON.parse(msg.Body);
  const resultKey = s3Key
    .replace('ingest/', 'results/')
    .replace(path.extname(s3Key), '.json');

  try {
    // 1) Download audio from S3
    const { Body: audioBuffer } = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key:    s3Key
    }).promise();

    // 2) Write to a temp file for the SDK
    const tmpDir  = path.join(__dirname, 'tmp');
    const tmpPath = path.join(tmpDir, path.basename(s3Key));
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpPath, audioBuffer);

    // 3) Transcribe via Whisper
    const transcription = await openai.audio.transcriptions.create({
      file:  fs.createReadStream(tmpPath),
      model: 'whisper-1'
    });

    // 4) Auto-code via GPT
    const codePrompt = `
Transcript:
${transcription.text}

Extract ICD-10 and CPT codes as an array of objects:
[{ code, description, confidence }, …]
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a medical coding assistant.' },
        { role: 'user',   content: codePrompt }
      ]
    });
    const codeSuggestions = JSON.parse(completion.choices[0].message.content);

    // 5) Save to ClinicalNote
    await ClinicalNote.create({
      jobId:       sessionId,
      s3Key,
      s3ResultKey: resultKey,
      transcript:  transcription.text,
      codes:       codeSuggestions
    });

    // 6) Update the ScribeSession
    await ScribeSession.findByIdAndUpdate(sessionId, {
      transcript:     transcription.text,
      notesDraft:     transcription.text,
      codeSuggestions,
      status:         'ready'
    });

    // 7) Upload JSON results to S3 (optional)
    await s3.putObject({
      Bucket:      process.env.S3_RESULTS_BUCKET,
      Key:         resultKey,
      Body:        JSON.stringify({ transcript: transcription.text, codeSuggestions }, null, 2),
      ContentType: 'application/json'
    }).promise();

    // 8) Delete the message from SQS
    await sqs.deleteMessage({
      QueueUrl:      process.env.SQS_QUEUE_URL,
      ReceiptHandle: msg.ReceiptHandle
    }).promise();

    console.log(`✅ Processed session ${sessionId}`);
  } catch (err) {
    console.error(`❌ Error processing session ${sessionId}:`, err);
    // Optionally handle retries or send to DLQ here
  }
}

/**
 * Poll SQS continuously
 */
async function poll() {
  try {
    const resp = await sqs.receiveMessage({
      QueueUrl:            process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds:     20
    }).promise();

    if (resp.Messages) {
      await Promise.all(resp.Messages.map(processMessage));
    }
  } catch (err) {
    console.error('Worker: SQS receive error:', err);
  } finally {
    setImmediate(poll);
  }
}

console.log('Worker: starting poll loop');
poll();
