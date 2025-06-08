// server.js
require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const mongoose      = require('mongoose');
const cookieParser  = require('cookie-parser');

const authRoutes        = require('./routes/auth');             // ← auth.js
const appointmentRoutes = require('./routes/appointmentRoutes'); // appointmentRoutes.js
const scribeRoutes      = require('./routes/scribeRoutes');      // scribeRoutes.js

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://cpd360.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scribe', scribeRoutes);

app.get('/', (req, res) => res.send('CPD360 Backend Running'));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
