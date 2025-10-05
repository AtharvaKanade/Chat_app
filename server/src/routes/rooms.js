const express = require('express');
const { upsertRoom, joinRoom, getRoom, listRooms } = require('../controllers/roomController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/upsert', authMiddleware, upsertRoom);
router.post('/join', authMiddleware, joinRoom);
router.get('/:name', authMiddleware, getRoom);
router.get('/', authMiddleware, listRooms);

module.exports = router;


