const Pin = require("../models/pin");
const asyncHandler = require("express-async-handler");
const { validatePinData } = require("../middleware/pinMiddleware");

// @desc    Create a new pin
// @route   POST /api/pin/create
// @access  Private
exports.createPin = asyncHandler(async (req, res) => {
  const { name, location, icon } = req.body;
  const validationResult = validatePinData(req.body);
  if (validationResult.error) {
    return res.status(400).json({ message: validationResult.error });
  }

  const pin = await Pin.create({
    name,
    location: { type: "Point", coordinates: location },
    icon,
  });

  res.status(201).json(pin);
});

// @desc    Get all pins
// @route   GET /api/pin/get/all
// @access  Private
exports.getAllPins = asyncHandler(async (req, res) => {
  const pins = await Pin.find();
  res.status(200).json(pins);
});

// @desc    Get a single pin by ID
// @route   GET /api/pin/get/:id
// @access  Private
exports.getPinById = asyncHandler(async (req, res) => {
  const pin = await Pin.findById(req.params.id);
  if (!pin) {
    res.status(404);
    throw new Error("Pin not found");
  }
  res.status(200).json(pin);
});

// @desc    Update a pin by ID
// @route   PUT /api/pin/update/:id
// @access  Private
exports.updatePin = asyncHandler(async (req, res) => {
  const { name, location, icon } = req.body;
  const validationResult = validatePinData(req.body);
  if (validationResult.error) {
    return res.status(400).json({ message: validationResult.error });
  }

  const pin = await Pin.findByIdAndUpdate(
    req.params.id,
    { name, location: { type: "Point", coordinates: location }, icon },
    { new: true }
  );

  if (!pin) {
    res.status(404);
    throw new Error("Pin not found");
  }

  res.status(200).json(pin);
});

// @desc    Delete a pin by ID
// @route   DELETE /api/pin/delete/:id
// @access  Private
exports.deletePin = asyncHandler(async (req, res) => {
  const pin = await Pin.findByIdAndDelete(req.params.id);
  if (!pin) {
    res.status(404);
    throw new Error("Pin not found");
  }
  res.status(200).json({ message: "Pin removed" });
});
