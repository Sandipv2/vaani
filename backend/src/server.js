import express from "express"
import { ENV } from "./config/env";
import { connectDB } from "./config/db";

const app = express()

connectDB()

app.listen(ENV.PORT, () => {
    console.log(`Server is running at port 3000`);
})