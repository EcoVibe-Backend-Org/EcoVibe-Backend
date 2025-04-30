const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require("../middleware/auth");
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
// CREATE comment or reply
const createComment = asyncHandler(async (req, res) => {
    const { postId, content, parentId } = req.body;

    if (!postId || !content) {
        res.status(400).json("Post ID and content are required.");
        return;
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        res.status(404).json("Post not found.");
        return;
    }

    // Check if the user exists
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404).json("User not found.");
        return;
    }

    // Create the comment
    const comment = await Comment.create({
        user: req.user._id,
        post: postId,
        content,
        parent: parentId || null, // It's a reply if parentId is provided
    });

    res.status(201).json(comment);
});


// READ all comments for a post (with replies)
const getCommentsByPost = asyncHandler(async (req, res) => {
    const comments = await Comment.find({ post: req.params.postId })
        .populate("user", "username")
        .sort({ createdAt: 1 });

    // Structure replies as nested
    const map = {};
    const roots = [];

    comments.forEach(comment => {
        map[comment._id] = { ...comment._doc, replies: [] };
    });

    comments.forEach(comment => {
        if (comment.parent) {
            map[comment.parent]?.replies.push(map[comment._id]);
        } else {
            roots.push(map[comment._id]);
        }
    });

    res.status(200).json(roots);
});

// UPDATE comment
const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        res.status(404).json("Comment not found.");
        return;
    }

    if (comment.user.toString() !== req.user._id.toString()) {
        res.status(401).json("Not authorized to update this comment.");
        return;
    }

    comment.content = content || comment.content;
    const updated = await comment.save();
    res.status(200).json(updated);
});

const deleteCommentAndReplies = async (commentId) => {
    const replies = await Comment.find({ parent: commentId });
    for (const reply of replies) {
      await deleteCommentAndReplies(reply._id);
    }
    await Comment.deleteOne({ _id: commentId });
  };
  
  const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
  
    if (!comment) {
      res.status(404).json("Comment not found.");
      return;
    }
  
    if (comment.user.toString() !== req.user._id.toString()) {
      res.status(401).json("Not authorized to delete this comment.");
      return;
    }
  
    await deleteCommentAndReplies(comment._id);
  
    // Remove from post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });
  
    res.status(200).json({ message: "Comment and replies deleted" });
  });
  

// Routes
router.post("/", protect, createComment);
router.get("/:postId", getCommentsByPost);
router.patch("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;
