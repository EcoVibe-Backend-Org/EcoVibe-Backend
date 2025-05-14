const mongoose = require("mongoose");

const barcodeSchema = mongoose.Schema(
  {
    data: { 
      type: String, 
      required: [true, "Barcode data is required"], 
      unique: true,
      trim: true 
    },
    response: { 
      type: String, 
      required: [true, "Response is required"] 
    },
    description: { 
      type: String, 
      default: "" 
    },
    category: { 
      type: String, 
      default: "General" 
    }
  },
  { timestamps: true }
);

const Barcode = mongoose.model("Barcode", barcodeSchema);

module.exports = Barcode;
