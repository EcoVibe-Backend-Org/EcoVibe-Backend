const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require("../middleware/auth");
const Post = require("../models/post");

// Create Post
const CreatePost = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        res.status(400).json("Title and content are required.");
        return;
    }

    const userExists = await User.findById(req.user._id);
    if (!userExists) {
        res.status(404).json("User not found.");
        return;
    }

    const post = await Post.create({
        user: req.user._id, // This connects the post to the logged-in user
        title,
        content,
    });

    res.status(201).json(post);
});


//Read All Posts
const Read_All_Post = asyncHandler(async (req, res) => {
    const posts = await Post.find().populate("username");
    res.status(200).json(posts);
});

//Read Single Post
const Read_Single_Post = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate("user", "username");

    if (!post) {
        res.status(404).json("Post not found.");
        return;
    }

    res.status(200).json(post);
});

//Update Post
const updatePost = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404).json("Post not found.");
        return;
    }

    if (post.user.toString() !== req.user._id.toString()) {
        res.status(401).json("Not authorized to update this post.");
        return;
    }

    post.title = title || post.title;
    post.content = content || post.content;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
});

// DELETE post
const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404).json("Post not found.");
        return;
    }

    if (post.user.toString() !== req.user._id.toString()) {
        res.status(401).json("Not authorized to delete this post.");
        return;
    }

    await post.remove();
    res.status(200).json({ message: "Post deleted successfully" });
});


// Routes
router.post("/", protect, CreatePost);
router.get("/", Read_All_Post);
router.get("/:id", Read_Single_Post);
router.patch("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;