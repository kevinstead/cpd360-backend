const express    = require('express');
const router     = express.Router();
const { auth, authorize } = require('../middleware/auth');
const appointmentCtrl     = require('../controllers/appointmentController');

// POST   /api/appointments        ← any logged-in user
router.post('/', auth, appointmentCtrl.createAppointment);

// GET    /api/appointments        ← provider/admin only
router.get('/', auth, authorize('provider','admin'), appointmentCtrl.getAllAppointments);

// GET    /api/appointments/me     ← each user sees only their own
router.get('/me', auth, appointmentCtrl.getMyAppointments);

// PUT    /api/appointments/:id    ← any logged-in user (you can add ownership checks later)
router.put('/:id', auth, appointmentCtrl.updateAppointment);

// DELETE /api/appointments/:id    ← any logged-in user
router.delete('/:id', auth, appointmentCtrl.deleteAppointment);

module.exports = router;
