import { Router } from "express";
import {
    getChatToken,
    getOrCreateChannel,
    hideChannel,
} from "../controllers/chat.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/token", protectRoute, getChatToken);
router.post("/channels", protectRoute, getOrCreateChannel);
router.delete("/channels/:channelId", protectRoute, hideChannel);

export default router;
