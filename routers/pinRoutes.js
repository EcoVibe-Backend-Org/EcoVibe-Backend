const express = require("express");
const router = express.Router();
const pinController = require("../controllers/pinController");

// Create a new pin
router.post("/create", pinController.createPin);

// Get all pins
router.get("/get/all", pinController.getAllPins);

// Get a single pin by ID
router.get("/get/:id", pinController.getPinById);

// Update a pin by ID
router.put("/update/:id", pinController.updatePin);

// Delete a pin by ID
router.delete("/delete/:id", pinController.deletePin);

// Filter pins based on criteria
router.post("/get/filtered", pinController.getFilteredPins);

module.exports = router;
// This code defines the routes for the pin-related operations in an Express application.
// It includes routes for creating, retrieving, updating, and deleting pins.
// The routes are defined using the Express Router and are linked to the corresponding controller functions.
// The router is then exported for use in the main application file.
// The routes are prefixed with "/pin" to indicate that they are related to pin operations.
// The controller functions (createPin, getAllPins, getPinById, updatePin, deletePin) are assumed to be defined in the pinController module.
