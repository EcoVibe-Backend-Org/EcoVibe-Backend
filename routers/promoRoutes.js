const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');

// First, check if your auth middleware exists and fix the import
// If you don't have auth yet, you can comment it out temporarily
// const { auth } = require('../middleware/auth'); 

// Instead, let's create a simple placeholder middleware for now
const auth = (req, res, next) => {
  // Simple placeholder that just continues to the next middleware
  next();
};

// Public routes (no auth required)
router.get('/', promoController.getAllPromoCodes);
router.get('/:id', promoController.getPromoCode);

// Protected routes
// Make sure these controller functions actually exist in promoController.js
router.get('/user/:userId', auth, promoController.getAvailablePromoCodes);
router.post('/', auth, promoController.createPromoCode);
router.put('/:id', auth, promoController.updatePromoCode);
router.delete('/:id', auth, promoController.deletePromoCode);

module.exports = router;
