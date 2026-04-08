import { getAuth } from "@clerk/express";
import { asyncHandler } from "../config/asyncHandler.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import cloudinary from "../config/cloudinary.js";

const deletePostMediaFromCloudinary = async (media = []) => {
    for (const item of media) {
        if (!item?.publicId) {
            continue;
        }

        await cloudinary.uploader.destroy(item.publicId, {
            resource_type: item.type === "video" ? "video" : "image",
        });
    }
};

const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate("user", "usrname firstName lastName profilePicture")
        .populate({
            path: "comments",
            populate: {
                path: "user",
                select: "username firstName lastName profilePicture"
            }
        });

    res.status(200).json({ posts })
})

const getPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await Post.findById(postId)
        .populate("user", "username firstName lastName profilePicture")
        .populate({
            path: "comments",
            populate: {
                path: "user",
                select: "username firstName lastName profilePicture"
            }
        });

    if (!post) {
        return res.status(404).json({ error: "Post not found" })
    }

    res.status(200).json({ post });
})

const getUserPost = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate("user", "username firstName lastName profilePicture")
        .populate({
            path: "comments",
            populate: {
                path: "user",
                select: "username firstName lastName profilePicture"
            }
        });

    res.status(200).json({ posts });
})

const createPost = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { content } = req.body;
    const files = req.files;

    if (!content && (!files || files.length === 0)) {
        return res.status(400).json({ error: "Post must contain either text, image or video" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
        return res.status(400).json({
            error: "User not found"
        });
    }

    const media = [];

    if (files && files.length > 0) {
        for (const file of files) {
            try {
                const base64file = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

                const uploadResponse = await cloudinary.uploader.upload(base64file, {
                    folder: "vaani_media_posts",
                    resource_type: "auto",
                    transformation: file.mimetype.startsWith("image/") ? [
                        { width: 800, height: 600, crop: "limit" },
                        { quality: "auto" },
                        { format: "auto" }
                    ] : undefined
                });

                media.push({
                    url: uploadResponse.secure_url,
                    type: uploadResponse.resource_type,
                    publicId: uploadResponse.public_id
                });

            } catch (error) {
                console.log("Cloudinary upload error:", error);
                return res.status(400).json({
                    error: "Cloudinary upload error"
                });
            }
        }
    }

    const post = await Post.create({
        user: user._id,
        content: content || "",
        media,
    })

    res.status(201).json({
        post
    })
})

const likePost = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { postId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    const post = await Post.findById(postId);

    if (!user || !post) {
        return res.status(404).json(
            { error: "User or post not found" }
        );
    }

    const isLiked = post.likes.includes(user._id);

    if (isLiked) {
        // unlike
        await Post.findByIdAndUpdate(postId, {
            $pull: { likes: user._id },
        });
    } else {
        // like
        await Post.findByIdAndUpdate(postId, {
            $push: { likes: user._id },
        });

        // if not liking the own post, create notification
        if (post.user.toString() !== user._id.toString()) {
            await Notification.create({
                from: user._id,
                to: post.user,
                type: "like",
                post: postId,
            });
        }
    }

    res.status(200).json({
        message: isLiked ? "Post unliked successfully" : "Post liked successfully",
    });
})

const deletePost = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { postId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    const post = await Post.findById(postId);

    if (!user || !post) {
        return res.status(404).json({
            error: "User or post not found"
        });
    }

    if (post.user.toString() !== user._id.toString()) {
        return res.status(403).json({
            error: "You can only delete your own posts"
        });
    }

    try {
        await deletePostMediaFromCloudinary(post.media);
    } catch (error) {
        console.log("Cloudinary delete error:", error);
        return res.status(400).json({
            error: "Failed to delete post media"
        });
    }

    // delete all comments on this post
    await Comment.deleteMany({ post: postId });

    // delete the post
    await Post.findByIdAndDelete(postId);

    res.status(200).json({
        message: "Post deleted successfully"
    });
})


export {
    getPosts,
    getPost,
    getUserPost,
    createPost,
    likePost,
    deletePost,
}
