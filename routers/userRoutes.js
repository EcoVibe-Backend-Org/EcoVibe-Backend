const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const {protect} = require("../middleware/auth")
var passwordValidator = require('password-validator');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const validator = require('validator');

var schema = new passwordValidator();
schema.is().min(8)
.is().max(20)
.has().uppercase()
.has().lowercase()
.has().digits(1)
.has().not().spaces()

const genToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
}


const registerUser = asyncHandler(async (req, res) => {
    const {username, email, password, phone , firstName, lastName} = req.body;
    if(!username || !email || !password || !firstName || !lastName) {
        res.status(400).json("Please fill in all fields");
        return
    }
    if (!schema.validate(password)) {
        res.status(400).json("Password doesn't meet criteria")
        return
    }

    const phoneNumber = parsePhoneNumberFromString(phone);

    if (!phoneNumber || !phoneNumber.isValid()) {
        res.status(400).json("Invalid phone number");
        return
    }

    if (!validator.isEmail(email)) {
        res.status(400).json("Invalid email address");
        return
    }
    const userExists = await User.findOne({username})
    const emailExists = await User.findOne({email})

    if (userExists) {
        res.status(400).json("Username exists");
        return
    }

    if (emailExists) {
        res.status(400).json("Email exists");
        return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName
    })

    if(user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: genToken(user._id)
        })
    }
    else {
        res.status(400).json("Invalid user data");
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const {username, password} = req.body;

    const user = await User.findOne({username})

    if(user && (await bcrypt.compare(password, user.password))) {
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: genToken(user._id)
        })
    }
    else {
        res.status(400).json("Invalid credentials");
    }

})

const getUser = asyncHandler(async (req, res) => {
    const {_id, email, username, firstName, lastName} = await User.findById(req.user.id)
    res.status(200).json({
        id: _id,
        email,
        username,
        firstName,
        lastName
    })
})

const updateUser = asyncHandler(async(req,res) => {
    const {username, email, firstName, lastName} = req.body;
    if(!username || !email || !firstName || !lastName) {
        res.status(400).json("Please fill in all fields");
    }
    const user = await User.findById(req.params.id)
    if(!user) {
        res.status(401).json("User not found");
    }
    
    const userExists = await User.findOne({username})
    const emailExists = await User.findOne({email})

    if (userExists && userExists.username != user.username) {
        res.status(400).json("Username already exists");
        return
    }

    else if (emailExists && emailExists.email != user.email) {
        res.status(400).json("Email already exists");
        return
    }


    try {
        User.findByIdAndUpdate({_id: req.params.id}, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        }).then(doc => {
        res.status(201).json({
            id: user._id,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            token: genToken(user._id)
        })
    })} 
    catch (error) {
        res.status(500)
    }
})

router.post('/register', registerUser)
router.post('/login', loginUser)
router.patch("/update/:id", protect, updateUser)
router.get('/:id', getUser)

module.exports = router;