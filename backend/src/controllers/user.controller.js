import { clerkClient, getAuth } from "@clerk/express";
import { asyncHandler } from "../config/asyncHandler.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

const getUserPofile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = User.findOne({ username });
    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    res.status(200).json({
        user,
    })
})

const updateProfile = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const files = req.files || {};

    const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        bio: req.body.bio,
        location: req.body.location,
    };

    const profilePictureFile = files.profilePicture?.[0];
    const bannerImageFile = files.bannerImage?.[0];

    if (profilePictureFile) {
        const base64file = `data:${profilePictureFile.mimetype};base64,${profilePictureFile.buffer.toString("base64")}`;
        const uploadResponse = await cloudinary.uploader.upload(base64file, {
            folder: "vaani_profile_images",
            resource_type: "image",
            transformation: [
                { width: 600, height: 600, crop: "limit" },
                { quality: "auto" },
                { format: "auto" }
            ]
        });

        updateData.profilePicture = uploadResponse.secure_url;
    }

    if (bannerImageFile) {
        const base64file = `data:${bannerImageFile.mimetype};base64,${bannerImageFile.buffer.toString("base64")}`;
        const uploadResponse = await cloudinary.uploader.upload(base64file, {
            folder: "vaani_banner_images",
            resource_type: "image",
            transformation: [
                { width: 1600, height: 900, crop: "limit" },
                { quality: "auto" },
                { format: "auto" }
            ]
        });

        updateData.bannerImage = uploadResponse.secure_url;
    }

    const user = await User.findOneAndUpdate(
        { clerkId: userId },
        updateData,
        { returnDocument: "after" }
    );

    if (!user) {
        return res.status(404).json({
            error: "User not found"
        })
    }

    res.status(200).json({
        user,
    })
})

const syncUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
        return res.status(200).json({
            user: existingUser,
            message: "User already exists"
        })
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const userData = {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
        profilePicture: clerkUser.imageUrl || ""
    }

    const user = await User.create(userData);

    res.status(201).json({
        user,
        message: "User created successfully"
    })
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
})

const followUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { targetUserId } = req.params;

    if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

    const currentUser = await User.findOne({ clerkId: userId });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
        // unfollow
        await User.findByIdAndUpdate(currentUser._id, {
            $pull: { following: targetUserId },
        });
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { followers: currentUser._id },
        });
    } else {
        // follow
        await User.findByIdAndUpdate(currentUser._id, {
            $push: { following: targetUserId },
        });
        await User.findByIdAndUpdate(targetUserId, {
            $push: { followers: currentUser._id },
        });

        // create notification
        await Notification.create({
            from: currentUser._id,
            to: targetUserId,
            type: "follow",
        });
    }

    res.status(200).json({
        message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
    });
})

export {
    getUserPofile,
    updateProfile,
    syncUser,
    getCurrentUser,
    followUser,
}
