const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const appointmentCtrl = require("../controllers/appointmentController");

// POST   /api/appointments
router.post("/", auth, appointmentCtrl.createAppointment);

// GET    /api/appointments        ← admin & provider
router.get("/", auth, authorize("provider", "admin"), appointmentCtrl.getAllAppointments);

// GET    /api/appointments/me     ← logged-in patient
router.get("/me", auth, appointmentCtrl.getMyAppointments);

// GET    /api/appointments/provider ← logged-in provider only
router.get("/provider", auth, authorize("provider"), appointmentCtrl.getProviderAppointments);

// PUT    /api/appointments/:id
router.put("/:id", auth, appointmentCtrl.updateAppointment);

// DELETE /api/appointments/:id
router.delete("/:id", auth, appointmentCtrl.deleteAppointment);

module.exports = router;
