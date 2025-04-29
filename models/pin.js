const mongoose = require("mongoose");

const pinSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Please add a name"], trim: true },
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
          validator: (arr) => arr.length === 2,
          message: "Coordinates must be [lng, lat]",
        },
      },
    },
    type: {
      type: String,
      enum: ["Recycling Bin", "Recycling Vendor", "Community Drop-off"],
      required: true,
    },
    description: { type: String, default: "" },
    acceptedMaterials: { type: [String], default: [] },
    icon: { type: String, default: "./assets/default-icon.png" },
  },
  { timestamps: true }
);

pinSchema.index({ location: "2dsphere" });
const Pin = mongoose.model("Pin", pinSchema);

module.exports = Pin;
