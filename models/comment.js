const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
