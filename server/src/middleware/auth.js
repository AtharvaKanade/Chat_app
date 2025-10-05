const jwt = require('jsonwebtoken');
const { jwtSecret, cookieName } = require('../config');

function authMiddleware(req, res, next) {
  const token = req.cookies[cookieName] || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authMiddleware };


