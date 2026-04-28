import { Router } from "express";
import {
    getConversations,
    getMessages,
    getOrCreateConversation,
} from "../controllers/chat.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/conversations", protectRoute, getConversations);
router.post("/conversations", protectRoute, getOrCreateConversation);
router.get("/conversations/:conversationId/messages", protectRoute, getMessages);

export default router;
