require('dotenv').config();                  // load .env
const AWS       = require('aws-sdk');
const mongoose  = require('mongoose');
const fs        = require('fs');
const path      = require('path');
const { Configuration, OpenAIApi } = require('openai');

const ClinicalNote = require('./models/ClinicalNote');

// ─── AWS CONFIG ────────────────────────────────────────────────────────────────
AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

// ─── OPENAI CONFIG ─────────────────────────────────────────────────────────────
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

// ─── MONGO CONNECT ─────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Worker: MongoDB connected'))
  .catch(err => console.error('Worker: MongoDB error:', err));

// ─── PROCESS A SINGLE MESSAGE ─────────────────────────────────────────────────
async function processMessage(msg) {
  const { s3Key } = JSON.parse(msg.Body);
  const jobId       = s3Key;
  const resultKey   = s3Key.replace('ingest/', 'results/').replace(path.extname(s3Key), '.json');

  try {
    // 1) Download audio from ingest bucket
    const audioObj = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    }).promise();

    // 2) Write temp file for OpenAI SDK
    const tmpPath = `/tmp/${path.basename(s3Key)}`;
    fs.writeFileSync(tmpPath, audioObj.Body);

    // 3) Transcribe with Whisper
    const transcription = await openai.createTranscription(
      fs.createReadStream(tmpPath),
      'whisper-1'
    );

    // 4) Auto-code via LLM
    const prompt = `
Transcript:
${transcription.data.text}

Extract relevant ICD-10 and CPT codes as a JSON object with keys "ICD10" and "CPT".
`;
    const completion = await openai.createCompletion({
      model: 'gpt-4o',
      prompt,
      max_tokens: 500
    });
    const codes = JSON.parse(completion.data.choices[0].text.trim());

    // 5) Upload results JSON to results bucket
    const resultBody = JSON.stringify({
      transcript: transcription.data.text,
      codes
    }, null, 2);

    await s3.putObject({
      Bucket: process.env.S3_RESULTS_BUCKET,
      Key: resultKey,
      Body: resultBody,
      ContentType: 'application/json'
    }).promise();

    // 6) Save record in MongoDB
    await ClinicalNote.create({
      jobId,
      s3Key,
      s3ResultKey: resultKey,
      transcript: transcription.data.text,
      codes
    });

    // 7) Delete processed message from SQS
    await sqs.deleteMessage({
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: msg.ReceiptHandle
    }).promise();

    console.log(`✅ Processed job ${jobId}`);
  } catch (err) {
    console.error(`❌ Error processing ${jobId}:`, err);
    // Message will become visible again or you can route to a DLQ
  }
}

// ─── POLL LOOP ─────────────────────────────────────────────────────────────────
async function pollQueue() {
  try {
    const { Messages } = await sqs.receiveMessage({
      QueueUrl:            process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds:     20
    }).promise();

    if (Messages) {
      for (const msg of Messages) {
        await processMessage(msg);
      }
    }
  } catch (err) {
    console.error('Worker: SQS receive error:', err);
  } finally {
    setImmediate(pollQueue);
  }
}

console.log('Worker: Starting SQS poll loop…');
pollQueue();
