const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // ✅ This is your real JWT middleware
const appointmentCtrl = require("../controllers/appointmentController"); // ✅ Points to full CRUD logic

// Routes
router.post("/", auth, appointmentCtrl.createAppointment);
router.get("/", auth, appointmentCtrl.getMyAppointments);
router.put("/:id", auth, appointmentCtrl.updateAppointment);
router.delete("/:id", auth, appointmentCtrl.deleteAppointment);

module.exports = router;
