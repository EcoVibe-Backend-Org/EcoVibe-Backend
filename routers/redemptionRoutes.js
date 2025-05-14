const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');

// Temporary auth middleware (replace with your actual auth middleware when ready)
const auth = (req, res, next) => {
  next();
};

// Protected routes
router.post('/redeem', auth, redemptionController.redeemPromoCode);
router.get('/user/:userId', auth, redemptionController.getUserRedemptions);
router.put('/:redemptionId/use', auth, redemptionController.markRedemptionAsUsed);

module.exports = router;
