const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderUsername: { type: String, default: '' },
    roomId: { type: String, index: true }, // could be direct:<userA-userB> or channel id
    text: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);


