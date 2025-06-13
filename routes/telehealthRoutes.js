// routes/telehealthRoutes.js

const express = require('express');
const router  = express.Router();

// Destructure both middlewares out of your one auth.js file
const { auth, authorize } = require('../middleware/auth');

// Controller functions
const {
  getToken,
  createRoom,
  listRooms
} = require('../controllers/telehealthController');

// POST /api/telehealth/token
// Any authenticated user may fetch a Twilio token
router.post(
  '/token',
  auth,
  getToken
);

// POST /api/telehealth/rooms
// Only 'admin' or 'provider' roles can create new rooms
router.post(
  '/rooms',
  auth,
  authorize('admin', 'provider'),
  createRoom
);

// GET /api/telehealth/rooms
// Only 'admin' may list recent rooms
router.get(
  '/rooms',
  auth,
  authorize('admin'),
  listRooms
);

module.exports = router;
