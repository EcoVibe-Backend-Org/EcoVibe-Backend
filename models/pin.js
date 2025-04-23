const mongoose = require("mongoose");

const pinSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          // Ensure array has exactly two elements
          validator: (arr) => arr.length === 2,
          message: "Coordinates must be [lng, lat]",
        },
      },
    },
    icon: {
      type: String,
      default: "./assets/default-icon.png",
    },
  },
  {
    timestamps: true,
  }
);

pinSchema.index({ location: "2dsphere" });
const Pin = mongoose.model("Pin", pinSchema);
module.exports = Pin;
