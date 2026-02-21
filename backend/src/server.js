import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(ENV.PORT, () => {
        console.log(`Server is running at port: ${ENV.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB Connection Failed: ",err)
})