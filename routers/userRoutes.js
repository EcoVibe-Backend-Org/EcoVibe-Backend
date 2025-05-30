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
const Friend = require("../models/friend");
const Post = require("../models/post");
const Comment = require("../models/comment");
const AIimageClassifier = require("../models/AIimageClassifier");

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
        lastName,
        phone
    })

    if(user) {
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

// Search users
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    res.status(400).json('Search query is required');
    return;
  }
  
  // Search by username, email, or phone
  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ],
    _id: { $ne: req.user.id } // Exclude the current user
  }).select('username firstName lastName _id');
  
  res.status(200).json(users);
}));

// Get pending friend requests
router.get('/friend-requests', protect, asyncHandler(async (req, res) => {
  const requests = await Friend.find({ 
    recipient: req.user.id,
    status: 'pending'
  }).populate('requester', 'username firstName lastName');
  
  res.status(200).json(requests);
}));

// Get friends list
router.get('/friends', protect, asyncHandler(async (req, res) => {
  const friends = await Friend.find({
    $or: [
      { requester: req.user.id, status: 'accepted' },
      { recipient: req.user.id, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username firstName lastName');
  
  // Format the response to show the friend's info (not the current user)
  const formattedFriends = friends.map(friend => {
    const isFriendRequester = friend.requester._id.toString() !== req.user.id;
    return {
      _id: friend._id,
      friend: isFriendRequester ? friend.requester : friend.recipient,
      status: friend.status,
      createdAt: friend.createdAt
    };
  });
  
  res.status(200).json(formattedFriends);
}));

router.get('/points/:id', protect, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Verify the user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json('User not found');
    return;
  }
  
  res.status(200).json({ points: user.currentPoints || 0 });
}));

// Get user's last 4 activities
router.get('/recent-activity/:id', protect, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Verify the user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json('User not found');
    return;
  }
  
  // Get the user's recent posts
  const posts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(4)
    .select('_id title createdAt');
  
  // Get the user's recent comments
  const comments = await Comment.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(4)
    .select('_id content createdAt post');
  
  // Get the user's recent AI image classifications
  const aiClassifications = await AIimageClassifier.find({ userID: userId })
    .sort({ createdAt: -1 })
    .limit(4)
    .select('_id response createdAt gptModel');
  
  // Combine all activities, sort by date, and take the 4 most recent
  const allActivities = [
    ...posts.map(post => ({
      type: 'post',
      _id: post._id,
      title: post.title,
      createdAt: post.createdAt
    })),
    ...comments.map(comment => ({
      type: 'comment',
      _id: comment._id,
      content: comment.content,
      postId: comment.post,
      createdAt: comment.createdAt
    })),
    ...aiClassifications.map(classification => ({
      type: 'aiClassification',
      _id: classification._id,
      response: classification.response,
      model: classification.gptModel,
      createdAt: classification.createdAt
    }))
  ];
  
  // Sort by date and limit to 4
  const recentActivities = allActivities
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4);
  
  res.status(200).json(recentActivities);
}));

// Get total number of AI images classified by user
router.get('/ai-classifications/count/:id', protect, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Verify the user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json('User not found');
    return;
  }
  
  // Count the total number of AI image classifications by this user
  const count = await AIimageClassifier.countDocuments({ userID: userId });
  
  res.status(200).json({ count });
}));
// Get user ranking: global and among friends
router.get('/rank', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Fetch the current user's totalPoints
  const currentUser = await User.findById(userId).select('totalPoints');
  if (!currentUser) {
    res.status(404).json("User not found");
    return;
  }

  // 1. Global rank
  const higherRankedUsers = await User.countDocuments({ totalPoints: { $gt: currentUser.totalPoints } });
  const globalRank = higherRankedUsers + 1;

  // 2. Friend rank
  const friends = await Friend.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  });

  const friendIds = friends.map(f => (
    f.requester.toString() === userId ? f.recipient : f.requester
  ));
  friendIds.push(userId);

  const friendUsers = await User.find({ _id: { $in: friendIds } }).select('totalPoints');
  const sortedFriends = friendUsers.sort((a, b) => b.totalPoints - a.totalPoints);
  const friendRank = sortedFriends.findIndex(user => user._id.toString() === userId) + 1;

  res.status(200).json({
    globalRank,
    friendRank,
    totalFriends: sortedFriends.length
  });
}));

// GET global leaderboard data
router.get('/leaderboard/global', protect, asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('firstName lastName totalPoints currentPoints')
    .sort({ totalPoints: -1 })
    .limit(50);  // Limit to top 50 users for performance
  
  res.status(200).json(users);
}));

// GET friends leaderboard data
router.get('/leaderboard/friends', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find all accepted friend relationships for the current user
  const friends = await Friend.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  });
  
  // Extract friend IDs
  const friendIds = friends.map(f => 
    f.requester.toString() === userId ? f.recipient : f.requester
  );
  
  // Include current user in the list
  friendIds.push(userId);
  
  // Get friend user details with populated data
  const friendsData = await User.find({ _id: { $in: friendIds } })
    .select('firstName lastName totalPoints currentPoints')
    .sort({ totalPoints: -1 });
  
  res.status(200).json(friendsData);
}));

// GET user's detailed stats for leaderboard
router.get('/leaderboard/stats', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Fetch the current user
  const currentUser = await User.findById(userId).select('totalPoints currentPoints');
  if (!currentUser) {
    res.status(404).json("User not found");
    return;
  }
  
  // Get next rank user's points (global)
  const nextRankUser = await User.findOne({ 
    totalPoints: { $gt: currentUser.totalPoints } 
  }).sort({ totalPoints: 1 }).select('totalPoints');
  
  // Get user's position in weekly leaderboard
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weeklyRank = await User.countDocuments({ 
    currentPoints: { $gt: currentUser.currentPoints },
    updatedAt: { $gte: weekStart }
  }) + 1;
  
  res.status(200).json({
    totalPoints: currentUser.totalPoints,
    currentPoints: currentUser.currentPoints,
    nextRankPoints: nextRankUser ? nextRankUser.totalPoints : currentUser.totalPoints + 100,
    weeklyRank
  });
}));

// GET time-based leaderboard (weekly, monthly, all-time)
router.get('/leaderboard/:timeframe', protect, asyncHandler(async (req, res) => {
  const { timeframe } = req.params;
  let dateFilter = {};
  let pointsField = 'totalPoints';
  
  // Set date filter based on timeframe
  if (timeframe === 'weekly') {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    dateFilter = { updatedAt: { $gte: weekStart } };
    pointsField = 'currentPoints';
  } else if (timeframe === 'monthly') {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    dateFilter = { updatedAt: { $gte: monthStart } };
    pointsField = 'currentPoints';
  }
  
  // Query users with the appropriate filter
  const users = await User.find(dateFilter)
    .select('firstName lastName totalPoints currentPoints')
    .sort({ [pointsField]: -1 })
    .limit(50);
  
  res.status(200).json(users);
}));

// Award points to a user
router.post('/award-points/:id', protect, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { points } = req.body;

  if (typeof points !== 'number' || points <= 0) {
    res.status(400).json('Points must be a positive number');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json('User not found');
    return;
  }

  user.currentPoints += points;
  user.totalPoints += points;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Awarded ${points} points to user.`,
    currentPoints: user.currentPoints,
    totalPoints: user.totalPoints
  });
}));


router.post('/register', registerUser)
router.post('/login', loginUser)
router.patch("/update/:id", protect, updateUser)
router.get('/:id', getUser)

module.exports = router;
