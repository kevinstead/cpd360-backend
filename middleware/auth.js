// middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // 1) Grab the Authorization header
  const authHeader = req.header('Authorization');
  console.log('AUTH HEADER:', authHeader);  // for debugging

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ msg: 'Malformed token' });
  }

  try {
    // 2) Verify with the correct environment variable
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3) Attach the payload (your token contains { id, iat, exp })
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    console.error('auth verify error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
