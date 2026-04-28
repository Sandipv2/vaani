import { Server } from "socket.io";
import { verifyToken } from "@clerk/express";
import { ENV } from "./config/env.js";
import Conversation from "./models/conversation.model.js";
import Message from "./models/message.model.js";
import User from "./models/user.model.js";
import { populateConversation, userSelect } from "./controllers/chat.controller.js";

let io;

const getUserRoom = (userId) => `user:${userId}`;

const setupSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Missing auth token"));
            }

            const verifiedToken = await verifyToken(token, {
                secretKey: ENV.CLERK_SECRET_KEY,
            });

            const user = await User.findOne({ clerkId: verifiedToken.sub });

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Socket authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(getUserRoom(socket.user._id));

        socket.on("sendMessage", async ({ conversationId, text }, callback) => {
            try {
                const messageText = String(text || "").trim();

                if (!conversationId || !messageText) {
                    callback?.({ ok: false, error: "Message text is required" });
                    return;
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.user._id,
                });

                if (!conversation) {
                    callback?.({ ok: false, error: "Conversation not found" });
                    return;
                }

                const message = await Message.create({
                    conversation: conversation._id,
                    sender: socket.user._id,
                    text: messageText,
                });

                conversation.lastMessage = message._id;
                await conversation.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate("sender", userSelect);

                const populatedConversation = await populateConversation(
                    Conversation.findById(conversation._id)
                );

                conversation.participants.forEach((participantId) => {
                    io.to(getUserRoom(participantId)).emit("newMessage", populatedMessage);
                    io.to(getUserRoom(participantId)).emit("conversationUpdated", populatedConversation);
                });

                callback?.({ ok: true, message: populatedMessage });
            } catch (error) {
                callback?.({ ok: false, error: "Failed to send message" });
            }
        });
    });

    return io;
};

export { getUserRoom, setupSocket };
