import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { arcjetMiddleware } from "./middlewares/arcjet.middleware.js";
import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";

const app = express();

app.use(cors());
app.use(clerkMiddleware());
app.use(arcjetMiddleware);
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "API Running",
    });
});


// Router imports
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: err.message || "Internal server error",
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => {
            console.log(`Server is running at port: ${ENV.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();

export default app;
