const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Friend = require('../models/friend');
const { protect } = require('../middleware/auth');

// Send friend request
router.post('/request', protect, asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  if (!recipientId) {
    res.status(400).json('Recipient ID is required');
    return;
  }

  // Check if friend request already exists
  const existingRequest = await Friend.findOne({ requester: req.user.id, recipient: recipientId });
  if (existingRequest) {
    res.status(400).json('Friend request already sent');
    return;
  }

  const friendRequest = await Friend.create({ requester: req.user.id, recipient: recipientId });
  res.status(201).json(friendRequest);
}));

// Accept friend request
router.post('/accept', protect, asyncHandler(async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    res.status(400).json('Request ID is required');
    return;
  }

  const friendRequest = await Friend.findById(requestId);
  if (!friendRequest || friendRequest.recipient.toString() !== req.user.id) {
    res.status(404).json('Friend request not found');
    return;
  }

  friendRequest.status = 'accepted';
  await friendRequest.save();
  res.status(200).json(friendRequest);
}));

// Delete friend request
router.delete('/delete/:id', protect, asyncHandler(async (req, res) => {
  const friendRequest = await Friend.findById(req.params.id);
  if (!friendRequest) {
    res.status(404).json('Friend request not found');
    return;
  }

  if (friendRequest.requester.toString() !== req.user.id && friendRequest.recipient.toString() !== req.user.id) {
    res.status(403).json('Not authorized to delete this friend request');
    return;
  }

  await friendRequest.remove();
  res.status(200).json({ message: 'Friend request deleted' });
}));

module.exports = router;
