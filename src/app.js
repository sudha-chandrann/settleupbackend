import express from "express"
import cors from "cors"
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import UserRouter from "./route/user.route.js"

dotenv.config();

const app = express()


app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))
app.use(cookieParser())
app.use("/api/v1/users", UserRouter);

export {app}