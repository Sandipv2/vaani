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

app.use("/api/v1/users", userRouter);

export { app }