const express = require("express");
const router = express.Router();
const {
  login,
  refresh,
  logout
} = require("../controllers/authController");

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/refresh
router.get("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

module.exports = router;
