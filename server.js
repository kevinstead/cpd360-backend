// server.js
require('dotenv').config();          // ← LOAD .env FIRST

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Route imports
const authRoutes        = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const scribeRoutes      = require('./routes/scribeRoutes');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'https://cpd360.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ─── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scribe', scribeRoutes);

// ─── Test & Start ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('CPD360 Backend Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
