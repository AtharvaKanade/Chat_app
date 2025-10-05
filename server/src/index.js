const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const { port, mongoUri, clientOrigins, cookieName } = require('./config');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const { registerSocketHandlers } = require('./socket');
const roomRoutes = require('./routes/rooms');

async function start() {
  await mongoose.connect(mongoUri);
  // Ensure default 'general' room exists
  try {
    const Room = require('./models/Room');
    await Room.findOneAndUpdate(
      { name: 'general' },
      { name: 'general', isPrivate: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (e) {
    console.error('Failed to ensure default room', e);
  }

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: clientOrigins,
      credentials: true,
    },
  });

  app.use(cors({ origin: clientOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/rooms', roomRoutes);

  registerSocketHandlers(io);

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


