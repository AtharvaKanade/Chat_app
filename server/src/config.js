const dotenv = require('dotenv');

dotenv.config();

function parseOrigins() {
  const envOrigins = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '';
  const defaults = ['http://localhost:5173', 'http://localhost:5174'];
  const list = envOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const combined = [...new Set([...defaults, ...list])];
  return combined;
}

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_app',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  clientOrigins: parseOrigins(),
  cookieName: process.env.COOKIE_NAME || 'token',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
};


