import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getNotifications, deleteNotificaton } from "../controllers/notification.controller.js";

const router = Router();

router.get("/", protectRoute, getNotifications);
router.delete("/:notificationId", protectRoute, deleteNotificaton);

export default router;