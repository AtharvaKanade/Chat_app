const Message = require('../models/Message');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

async function fetchRoomMessages(req, res) {
  const { roomId } = req.params;
  // Enforce room access for private rooms
  const room = await Room.findOne({ name: roomId });
  if (!room) return res.status(404).json({ error: 'room not found' });
  if (room && room.isPrivate) {
    const roomToken = req.headers['x-room-token'] || '';
    try {
      const payload = jwt.verify(String(roomToken), jwtSecret);
      if (payload.room !== roomId) return res.status(401).json({ error: 'invalid room token' });
    } catch (e) {
      return res.status(401).json({ error: 'room token required' });
    }
  }

  const messages = await Message.find({ roomId })
    .populate('senderId', 'username')
    .sort({ createdAt: 1 })
    .limit(200);
  // Backfill senderUsername for any old messages without it
  const hydrated = messages.map((m) => ({
    ...m.toObject(),
    senderUsername: m.senderUsername && m.senderUsername.length > 0 ? m.senderUsername : (m.senderId?.username || 'User'),
  }));
  return res.json(hydrated);
}

async function postMessage(req, res) {
  const { roomId, text } = req.body;
  if (!roomId || !text) return res.status(400).json({ error: 'roomId and text required' });
  const message = await Message.create({ roomId, text, senderId: req.user.id, senderUsername: req.user.username });
  return res.status(201).json(message);
}

module.exports = { fetchRoomMessages, postMessage };


