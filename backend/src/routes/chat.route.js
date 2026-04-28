import { Router } from "express";
import {
    deleteConversation,
    getConversations,
    getMessages,
    getOrCreateConversation,
    sendMessage,
} from "../controllers/chat.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/conversations", protectRoute, getConversations);
router.post("/conversations", protectRoute, getOrCreateConversation);
router.delete("/conversations/:conversationId", protectRoute, deleteConversation);
router.get("/conversations/:conversationId/messages", protectRoute, getMessages);
router.post("/conversations/:conversationId/messages", protectRoute, sendMessage);

export default router;
