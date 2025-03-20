import express from "express";
import dotenv from "dotenv";
import rootRouter from "./routes";

dotenv.config();

const app = express();
app.use(express.json());
app.use(rootRouter)

export default app;
