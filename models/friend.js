const mongoose = require('mongoose');

const friendSchema = mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, {
  timestamps: true
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;
