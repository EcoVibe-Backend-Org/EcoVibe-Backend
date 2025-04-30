const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    data: { type: String, required: true },      // base64 string
    mimetype: { type: String, required: true }
}, { _id: false });

const postSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        attachments: {
            type: [attachmentSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
