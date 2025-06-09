// routes/scribeRoutes.js
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/scribeController");

// const auth = require("../middleware/auth");
// router.use(auth);

router.post("/", controller.uploadAudio, controller.startScribe);
router.get("/:id", controller.getScribe);
router.post("/:id/finalize", express.json(), controller.finalizeScribe);

module.exports = router;

