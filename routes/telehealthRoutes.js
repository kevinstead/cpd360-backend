const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getToken,
  createRoom,
  listRooms
} = require('../controllers/telehealthController');

// POST /api/telehealth/token
router.post('/token', auth, getToken);

// POST /api/telehealth/rooms   (admins & providers)
router.post('/rooms', auth, authorize(['admin','provider']), createRoom);

// GET  /api/telehealth/rooms   (admins only)
router.get('/rooms', auth, authorize(['admin']), listRooms);

module.exports = router;
