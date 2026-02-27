import express from "express";
import cors from "cors";
import {clerkMiddleware} from "@clerk/express";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req,res) => {
    res.send("Hari Bol")
})

// Routes import
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRoutes);

app.use((err, req, res) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: err.message || "Internal server error"
    });
})

export { app }