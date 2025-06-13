// middleware/auth.js

require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // only needed if you want to verify user still exists

// ─── Protect ───────────────────────────────────────────────────
// Verifies JWT and attaches { id, role } to req.user
const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ msg: 'Malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally, verify user is still in the database:
    // const user = await User.findById(decoded.id);
    // if (!user) throw new Error('User not found');
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('auth verify error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// ─── Authorize ────────────────────────────────────────────────
// Takes a list of allowed roles: e.g. authorize('provider','admin')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = { auth, authorize };
