import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json, static as serveStatic, urlencoded } from "express";
import logger from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import roomsRouter from "./routes/rooms.js";

const app = express();

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL!;

const corsOptions = {
  origin: CLIENT_BASE_URL
};
app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(serveStatic(join(__dirname, '../public')));

app.use('/api/rooms', roomsRouter);

export default app;
