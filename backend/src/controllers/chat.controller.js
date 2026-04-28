import { getAuth } from "@clerk/express";
import { asyncHandler } from "../config/asyncHandler.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const userSelect = "username firstName lastName profilePicture";

const getLoggedInUser = async (req) => {
    const { userId } = getAuth(req);
    return User.findOne({ clerkId: userId });
};

const populateConversation = (query) => {
    return query
        .populate("participants", userSelect)
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: userSelect,
            },
        });
};

const getConversations = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    const conversations = await populateConversation(
        Conversation.find({ participants: currentUser._id }).sort({ updatedAt: -1 })
    );

    res.status(200).json({ conversations });
});

const getOrCreateConversation = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);
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

    let conversation = await Conversation.findOne({
        participants: { $all: [currentUser._id, targetUser._id], $size: 2 },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [currentUser._id, targetUser._id],
        });
    }

    const populatedConversation = await populateConversation(
        Conversation.findById(conversation._id)
    );

    res.status(200).json({ conversation: populatedConversation });
});

const getMessages = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);
    const { conversationId } = req.params;

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: currentUser._id,
    });

    if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", userSelect);

    res.status(200).json({ messages });
});

const deleteConversation = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);
    const { conversationId } = req.params;

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: currentUser._id,
    });

    if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
    }

    await Message.deleteMany({ conversation: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    res.status(200).json({ success: true, conversationId });
});

const sendMessage = asyncHandler(async (req, res) => {
    const currentUser = await getLoggedInUser(req);
    const { conversationId } = req.params;
    const messageText = String(req.body.text || "").trim();

    if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!messageText) {
        return res.status(400).json({ error: "Message text is required" });
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: currentUser._id,
    });

    if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: currentUser._id,
        text: messageText,
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", userSelect);

    const populatedConversation = await populateConversation(
        Conversation.findById(conversation._id)
    );

    res.status(201).json({
        message: populatedMessage,
        conversation: populatedConversation,
    });
});

export {
    deleteConversation,
    getConversations,
    getMessages,
    getOrCreateConversation,
    sendMessage,
    populateConversation,
    userSelect,
};
