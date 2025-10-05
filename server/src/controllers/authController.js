const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, cookieName, cookieSecure } = require('../config');

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ error: 'username already taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  return res.status(201).json({ id: user._id, username: user.username });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = jwt.sign({ sub: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: '7d' });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.json({ id: user._id, username: user.username, token });
}

async function me(req, res) {
  return res.json({ id: req.user.id, username: req.user.username });
}

function logout(_req, res) {
  res.clearCookie(cookieName);
  return res.json({ ok: true });
}

module.exports = { register, login, me, logout };


