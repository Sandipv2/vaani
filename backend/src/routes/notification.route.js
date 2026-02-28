import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protectRoute, );
router.get("/:notificationId", protectRoute, );

export default router;