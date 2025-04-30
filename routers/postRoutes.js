const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require("../middleware/auth");
const Post = require("../models/post");
const User = require("../models/user");

// Helper: Validate base64 Data URI
function parseBase64DataUri(dataUri) {
  // Example: data:image/png;base64,iVBORw0KGgo...
  const matches = dataUri.match(/^data:([a-zA-Z0-9\/\-\+\.]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimetype: matches[1],
    data: matches[2],
  };
}

// Create Post
const CreatePost = asyncHandler(async (req, res) => {
  const { title, content, attachments } = req.body;

  if (!title || !content) {
    return res.status(400).json("Title and content are required.");
  }

  const userExists = await User.findById(req.user._id);
  if (!userExists) {
    return res.status(404).json("User not found.");
  }

  // Validate and process attachments
// Validate and process attachments
let processedAttachments = [];
if (attachments && Array.isArray(attachments)) {
  processedAttachments = attachments.map((att, idx) => {
    // If already an object with data and mimetype, use it directly
    if (att && typeof att === "object" && att.data && att.mimetype) {
      return {
        filename: att.filename || `attachment_${Date.now()}_${idx}`,
        data: att.data,
        mimetype: att.mimetype,
      };
    }
    // Else, try to parse as Data URI string
    const base64Obj = parseBase64DataUri(att);
    if (!base64Obj) {
      throw new Error("Invalid base64 attachment format");
    }
    return {
      filename: `attachment_${Date.now()}_${idx}`,
      data: base64Obj.data,
      mimetype: base64Obj.mimetype,
    };
  });
}

  

  const post = await Post.create({
    user: req.user._id,
    title,
    content,
    attachments: processedAttachments,
  });

  res.status(201).json(post);
});

// Read All Posts
const Read_All_Post = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate("user", "username");
  res.status(200).json(posts);
});

// Read Single Post
const Read_Single_Post = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("user", "username");
  if (!post) {
    res.status(404).json("Post not found.");
    return;
  }
  res.status(200).json(post);
});

// Update Post
const updatePost = asyncHandler(async (req, res) => {
  const { title, content, attachments } = req.body;
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

    // Validate and process attachments
    let processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
    processedAttachments = attachments.map((att, idx) => {
        // If already an object with data and mimetype, use it directly
        if (att && typeof att === "object" && att.data && att.mimetype) {
        return {
            filename: att.filename || `attachment_${Date.now()}_${idx}`,
            data: att.data,
            mimetype: att.mimetype,
        };
        }
        // Else, try to parse as Data URI string
        const base64Obj = parseBase64DataUri(att);
        if (!base64Obj) {
        throw new Error("Invalid base64 attachment format");
        }
        return {
        filename: `attachment_${Date.now()}_${idx}`,
        data: base64Obj.data,
        mimetype: base64Obj.mimetype,
        };
    });
    }



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

  await Post.deleteOne({ _id: req.params.id });
  res.status(200).json({ message: "Post deleted successfully" });
});

// Routes
router.post("/", protect, CreatePost);
router.get("/", Read_All_Post);
router.get("/:id", Read_Single_Post);
router.patch("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
