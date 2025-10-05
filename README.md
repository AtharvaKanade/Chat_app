Real-Time Chat App MVP

Overview
This is a minimal full-stack real-time chat application using Node.js, Express, MongoDB, Socket.io, and a Vite + React frontend.

Stack

- Backend: Express, Socket.io, MongoDB (Mongoose)
- Frontend: React (Vite), socket.io-client, axios, react-router-dom

Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

Getting Started

1. Install deps

- Server:
  cd server
  npm install
- Client:
  cd ../client
  npm install

2. Configure environment (optional for local defaults)
   Backend env variables (create server/.env):
   PORT=4000
   MONGO_URI=mongodb://127.0.0.1:27017/chat_app
   JWT_SECRET=change_me
   CLIENT_ORIGIN=http://localhost:5173
   COOKIE_NAME=token
   COOKIE_SECURE=false

Frontend env variables (create client/.env):
VITE_API_BASE=http://localhost:4000

3. Run

- Start server:
  cd server
  npm run dev
- Start client:
  cd ../client
  npm run dev

Usage

- Visit http://localhost:5173
- Register a new account, then login
- Enter a room id (default: general) and start chatting

Notes

- The server sets an HTTP-only cookie and also returns a JWT token; the client uses the token for socket auth and API calls.
- CORS is configured to allow http://localhost:5173 with credentials.
