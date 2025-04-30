const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require("../middleware/auth");
const Post = require("../models/post");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];
        const extname = /\.(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/i.test(path.extname(file.originalname));
        if (allowedMimes.includes(file.mimetype) && extname) {
            return cb(null, true);
        }
        cb(new Error("Only supported file formats allowed!"));
    }
    
});

// Create Post with attachments
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

    // Process file attachments
    const attachmentPaths = [];
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            // Store the file path or URL
            attachmentPaths.push(`/uploads/${file.filename}`);
        });
    }

    const post = await Post.create({
        user: req.user._id,
        title,
        content,
        attachments: attachmentPaths
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

// Update Post with attachments
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

    // Process new attachments if any
    if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map(file => `/uploads/${file.filename}`);
        
        // If removeAttachments is provided in the request, remove those attachments
        if (req.body.removeAttachments) {
            const attachmentsToRemove = JSON.parse(req.body.removeAttachments);
            
            // Remove files from storage
            attachmentsToRemove.forEach(attachmentPath => {
                try {
                    const filePath = path.join(__dirname, '..', attachmentPath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.error("Error removing file:", error);
                }
            });
            
            // Filter out removed attachments
            post.attachments = post.attachments.filter(
                attachment => !attachmentsToRemove.includes(attachment)
            );
        }
        
        // Add new attachments
        post.attachments = [...post.attachments, ...newAttachments];
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

    // Delete attachment files
    if (post.attachments && post.attachments.length > 0) {
        post.attachments.forEach(attachmentPath => {
            try {
                const filePath = path.join(__dirname, '..', attachmentPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error("Error removing file:", error);
            }
        });
    }

    await Post.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Post deleted successfully" });
});

// Routes
router.post("/", protect, upload.array('attachments', 5), CreatePost);
router.get("/", Read_All_Post);
router.get("/:id", Read_Single_Post);
router.patch("/:id", protect, upload.array('attachments', 5), updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
