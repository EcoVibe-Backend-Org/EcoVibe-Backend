const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Barcode = require('../models/barcode');
const { protect } = require('../middleware/auth');

// Get barcode data by barcode value
router.get('/:data', asyncHandler(async (req, res) => {
  const barcodeData = await Barcode.findOne({ data: req.params.data });
  
  if (barcodeData) {
    res.status(200).json(barcodeData);
  } else {
    res.status(404).json({ message: 'Barcode not found in database' });
  }
}));


module.exports = router;
