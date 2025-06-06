const express = require("express");
const router = express.Router(); // ← THIS LINE must be here

const { loginUser } = require("../controllers/authController");

router.post("/login", loginUser);

module.exports = router;
