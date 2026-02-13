import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json, static as serveStatic, urlencoded } from "express";
import logger from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import env from "./config.js";
import roomsRouter from "./routes/rooms.js";
import puzzlesRouter from "./routes/puzzles.js";

const app = express();

const corsOptions = {
  origin: env.CLIENT_BASE_URL,
};
app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(serveStatic(join(__dirname, "../public")));

app.use("/api/rooms", roomsRouter);
app.use("/api/puzzles", puzzlesRouter);

export default app;
