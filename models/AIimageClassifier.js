const mongoose = require("mongoose");

const AIimageClassifierSchema = mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true, // Automatically generated
        },
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        image: {
            type: String, // For storing base64 encoded image
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
        gptModel: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: null,
        },
    },
    { timestamps: true } // This will add createdAt and updatedAt fields automatically
);

module.exports = mongoose.model("AIimageClassifier", AIimageClassifierSchema);
