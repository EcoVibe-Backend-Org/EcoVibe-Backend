const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please add a username"],
        unqiue: true
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true
    },
    firstName: {
        type: String,
        required: [true, "Please add a first name"]
    },
    lastName: {
        type: String,
        required: [true, "Please add a last name"]
    },
    password: {
        type: String,
        required: [true, "Please add a password"]
    },
    phone: {
        type: String,
        required: [true, "Please add a phone number"],
        unique: true
    }
}, {
    timestamps: true
})

const User = mongoose.model('User', userSchema);
module.exports = User;