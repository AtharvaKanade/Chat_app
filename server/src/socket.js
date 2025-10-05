const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');
const Room = require('./models/Room');
const Message = require('./models/Message');

let ioRef = null;

function getUserFromToken(token) {
  try {
    const payload = jwt.verify(token, jwtSecret);
    return { id: payload.sub, username: payload.username };
  } catch (_e) {
    return null;
  }
}

function registerSocketHandlers(io) {
  ioRef = io;
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    const user = getUserFromToken(token || '');
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join', async ({ roomId, roomToken, roomPassword }) => {
      if (!roomId) return;
      const room = await Room.findOne({ name: roomId });
      if (!room) return; // block joining non-existent rooms
      if (room && room.isPrivate) {
        // Prefer token if provided
        if (roomToken) {
          try {
            const t = jwt.verify(roomToken, jwtSecret);
            if (t.room !== roomId) return;
          } catch (_e) {
            return;
          }
        } else if (roomPassword) {
          const bcrypt = require('bcryptjs');
          const ok = await bcrypt.compare(roomPassword, room.passwordHash || '');
          if (!ok) return;
        } else {
          return;
        }
      }
      socket.join(roomId);
    });

    socket.on('message:send', async ({ roomId, text }) => {
      if (!roomId || !text) return;
      const message = await Message.create({ roomId, text, senderId: socket.user.id, senderUsername: socket.user.username });
      io.to(roomId).emit('message:new', message);
    });
  });
}

function getIO() {
  return ioRef;
}

module.exports = { registerSocketHandlers, getIO };


