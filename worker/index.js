// worker/index.js
require('dotenv').config();
const AWS       = require('aws-sdk');
const fs        = require('fs');
const path      = require('path');
const mongoose  = require('mongoose');
const { Configuration, OpenAIApi } = require('openai');

const ScribeSession = require('../models/ScribeSession');
const ClinicalNote  = require('../models/ClinicalNote');

AWS.config.update({ region: process.env.AWS_REGION });
const s3  = new AWS.S3();
const sqs = new AWS.SQS();

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

mongoose
  .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Worker: MongoDB connected'))
  .catch(err => console.error('Worker: MongoDB error:', err));

async function processMessage(msg) {
  const { sessionId, s3Key } = JSON.parse(msg.Body);
  const resultKey = s3Key.replace('ingest/', 'results/').replace(path.extname(s3Key), '.json');

  try {
    // 1) Download audio
    const { Body: audioBuffer } = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key:    s3Key
    }).promise();

    // 2) Write temp file
    const tmpDir  = path.join(__dirname, 'tmp');
    const tmpPath = path.join(tmpDir, path.basename(s3Key));
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpPath, audioBuffer);

    // 3) Transcribe
    const transcription = await openai.createTranscription(
      fs.createReadStream(tmpPath),
      'whisper-1'
    );

    // 4) Auto-code
    const prompt = `
Transcript:
${transcription.data.text}

Extract ICD-10 and CPT codes as an array of { code, description, confidence }.
`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a medical coding assistant.' },
        { role: 'user',   content: prompt }
      ]
    });
    const codeSuggestions = JSON.parse(completion.choices[0].message.content);

    // 5) Save ClinicalNote
    await ClinicalNote.create({
      jobId:       sessionId,
      s3Key,
      s3ResultKey: resultKey,
      transcript:  transcription.data.text,
      codes:       codeSuggestions
    });

    // 6) Update ScribeSession
    await ScribeSession.findByIdAndUpdate(sessionId, {
      transcript:     transcription.data.text,
      notesDraft:     transcription.data.text,
      codeSuggestions,
      status:         'ready'
    });

    // 7) (Optional) Upload results JSON
    await s3.putObject({
      Bucket:      process.env.S3_RESULTS_BUCKET,
      Key:         resultKey,
      Body:        JSON.stringify({ transcript: transcription.data.text, codeSuggestions }, null, 2),
      ContentType: 'application/json'
    }).promise();

    // 8) Delete SQS message
    await sqs.deleteMessage({
      QueueUrl:      process.env.SQS_QUEUE_URL,
      ReceiptHandle: msg.ReceiptHandle
    }).promise();

    console.log(`✅ Processed session ${sessionId}`);
  } catch (err) {
    console.error(`❌ Error processing session ${sessionId}:`, err);
  }
}

async function poll() {
  const resp = await sqs.receiveMessage({
    QueueUrl:            process.env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds:     20
  }).promise();

  if (resp.Messages) {
    await Promise.all(resp.Messages.map(processMessage));
  }
  setImmediate(poll);
}

console.log('Worker: starting poll loop');
poll();
