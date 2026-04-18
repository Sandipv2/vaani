import { Router } from "express";
import {
    followUser, 
    getCurrentUser, 
    getUserPofile, 
    syncUser,
    updateProfile 
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

// public routes
router.get("/profile/:username", getUserPofile);

// Protected route 
router.put(
    "/profile",
    protectRoute,
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "bannerImage", maxCount: 1 },
    ]),
    updateProfile
);
router.post("/sync", protectRoute, syncUser);
router.get("/me", protectRoute, getCurrentUser);
router.post("/follow/:targetUserId", protectRoute, followUser);

export default router;
