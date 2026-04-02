// // Extend express-session types to support userId
// declare module "express-session" {
//   interface SessionData {
//     userId?: number;
//   }
// }
import authRouter from "./auth.js";
import session from "express-session";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json, static as serveStatic, urlencoded } from "express";
import helmet from "helmet";
import logger from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import env from "./config.js";
import roomsRouter from "./routes/rooms.js";
import puzzlesRouter from "./routes/puzzles.js";

const app = express();

const corsOptions = {
  origin: env.CLIENT_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(serveStatic(join(__dirname, "../public")));

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET must be set in production");
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: sessionSecret || "dev-only-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api/rooms", roomsRouter);
app.use("/api/puzzles", puzzlesRouter);
app.use("/api/auth", authRouter);

export default app;
