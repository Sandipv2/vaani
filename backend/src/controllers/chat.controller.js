import { clerkClient, getAuth } from "@clerk/express";
import { StreamChat } from "stream-chat";
import { asyncHandler } from "../config/asyncHandler.js";
import { ENV } from "../config/env.js";
import User from "../models/user.model.js";

const getStreamClient = () => {
    if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
        throw new Error("Stream API credentials are not configured");
    }

    return StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET, {
        disableCache: true,
    });
};

const getLoggedInUser = (req) => {
    const { userId } = getAuth(req);
    return User.findOne({ clerkId: userId });
};

const ensureLoggedInUser = async (req) => {
    const { userId } = getAuth(req);
    let user = await User.findOne({ clerkId: userId });

    if (user) {
        return user;
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
        return null;
    }

    return User.create({
        clerkId: userId,
        email: primaryEmail,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        username: primaryEmail.split("@")[0],
        profilePicture: clerkUser.imageUrl || "",
    });
};

const getDisplayName = (user) => {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
};

const toStreamUser = (user) => ({
    id: user._id.toString(),
    name: getDisplayName(user),
    image: user.profilePicture || undefined,
    username: user.username,
});

const getDirectChannelId = (firstUserId, secondUserId) => {
    return [firstUserId, secondUserId].sort().join("-");
};

const getChatToken = asyncHandler(async (req, res) => {
    const currentUser = await ensureLoggedInUser(req);

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    const client = getStreamClient();
    const streamUser = toStreamUser(currentUser);

    await client.upsertUser(streamUser);

    res.status(200).json({
        apiKey: ENV.STREAM_API_KEY,
        token: client.createToken(streamUser.id),
        user: streamUser,
    });
});

const getOrCreateChannel = asyncHandler(async (req, res) => {
    const currentUser = await ensureLoggedInUser(req);
    const { targetUserId } = req.body;

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
    }

    if (currentUser._id.toString() === targetUserId) {
        return res.status(400).json({ error: "You cannot chat with yourself" });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
    }

    const client = getStreamClient();
    const currentStreamUser = toStreamUser(currentUser);
    const targetStreamUser = toStreamUser(targetUser);
    const channelId = getDirectChannelId(currentStreamUser.id, targetStreamUser.id);
    const channel = client.channel("messaging", channelId, {
        created_by_id: currentStreamUser.id,
        members: [currentStreamUser.id, targetStreamUser.id],
    });

    await client.upsertUsers([currentStreamUser, targetStreamUser]);
    await channel.create();

    res.status(200).json({
        channelId,
        cid: channel.cid,
    });
});

const hideChannel = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);
    const { channelId } = req.params;

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!channelId) {
        return res.status(400).json({ error: "channelId is required" });
    }

    const client = getStreamClient();
    const channel = client.channel("messaging", channelId);

    await channel.hide(currentUser._id.toString(), true);

    res.status(200).json({ success: true, channelId });
});

export {
    getChatToken,
    getOrCreateChannel,
    hideChannel,
};
