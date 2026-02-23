import { Router } from "express";
import {
    createPost,
    deletePost,
    getPost,
    getPosts,
    getUserPost,
    likePost,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

// public routes
router.get("/", getPosts);
router.get("/:postId", getPost);
router.get("/user/:username", getUserPost);

// protected routes
router.post("/", protectRoute, upload.array("media", 10), createPost);
router.post("/:postId/like", protectRoute, likePost);
router.delete("/:postId", protectRoute, deletePost);

export default router;