const express = require('express');
const { fetchRoomMessages, postMessage } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/:roomId', authMiddleware, fetchRoomMessages);
router.post('/', authMiddleware, postMessage);

module.exports = router;


