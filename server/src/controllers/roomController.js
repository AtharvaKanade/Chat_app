const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const { jwtSecret } = require('../config');
const { getIO } = require('../socket');

async function upsertRoom(req, res) {
  const { name, isPrivate, password } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  let passwordHash = '';
  if (isPrivate) {
    if (!password) return res.status(400).json({ error: 'password required for private room' });
    passwordHash = await bcrypt.hash(password, 10);
  }

  // disallow duplicate names on create; allow update by same name
  const existing = await Room.findOne({ name });
  if (existing && !('id' in req.body)) {
    return res.status(409).json({ error: 'room name already exists' });
  }

  const updated = existing
    ? await Room.findOneAndUpdate(
        { _id: existing._id },
        { isPrivate: !!isPrivate, passwordHash, createdBy: req.user?.id },
        { new: true }
      )
    : await Room.create({ name, isPrivate: !!isPrivate, passwordHash, createdBy: req.user?.id });

  // broadcast room privacy change
  try {
    const io = getIO();
    if (io) io.to(name).emit('room:update', { name, isPrivate: !!isPrivate });
  } catch (_e) {}

  return res.json(updated);
}

async function joinRoom(req, res) {
  const { name, password } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const room = await Room.findOne({ name });
  if (!room) return res.status(404).json({ error: 'room not found' });

  if (room.isPrivate) {
    const ok = await bcrypt.compare(password || '', room.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid room password' });
  }

  const token = jwt.sign({ room: name }, jwtSecret, { expiresIn: '2h' });
  return res.json({ ok: true, token });
}

module.exports = { upsertRoom, joinRoom };
async function getRoom(req, res) {
  const { name } = req.params;
  if (!name) return res.status(400).json({ error: 'name required' });
  const room = await Room.findOne({ name });
  if (!room) return res.json({ exists: false, isPrivate: false });
  return res.json({ exists: true, name: room.name, isPrivate: !!room.isPrivate });
}

module.exports = { upsertRoom, joinRoom, getRoom };
async function listRooms(_req, res) {
  const rooms = await Room.find({}, { name: 1, isPrivate: 1 }).sort({ name: 1 });
  return res.json(rooms);
}

module.exports = { upsertRoom, joinRoom, getRoom, listRooms };


