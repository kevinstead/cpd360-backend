// routes/scribeRoutes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const {
  startScribe,
  getScribe,
  finalizeScribe
} = require("../controllers/scribeController");

// start a new scribe session (upload audio)
router.post("/", auth, startScribe);

// get status/results of a session
router.get("/:id", auth, getScribe);

// finalize notes & codes
router.post("/:id/finalize", auth, finalizeScribe);

module.exports = router;
