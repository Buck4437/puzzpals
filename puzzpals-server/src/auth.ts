import express from "express";
import type { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFileSync } from "fs";
import env from "./config.js";
import { upsertGoogleUser, getAllUsersDebug } from "./db.js";

const router = express.Router();

function getoAuth2Client(): OAuth2Client {
  const credentials = JSON.parse(readFileSync("credentials.json", "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

const SCOPES = ["profile", "email"];

router.get("/google/login", (req, res) => {
  const oauth2Client = getoAuth2Client();
  const returnUrl =
    typeof req.query.returnUrl === "string" ? req.query.returnUrl : "/";
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: returnUrl,
  });
  res.redirect(url);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const oauth2Client = getoAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2("v2");
  const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });

  // Save user info to DB
  const googleId = userInfo.data.id ?? "";
  const dbUser = await upsertGoogleUser(
    googleId,
    userInfo.data.email || "",
    userInfo.data.name || "",
    userInfo.data.picture || "",
  );

  const returnUrl = typeof req.query.state === "string" ? req.query.state : "/";
  req.session.user = {
    id: dbUser.id,
    google_id: dbUser.google_id,
    is_guest: false,
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.picture,
  };
  res.redirect(`${env.CLIENT_BASE_URL}${returnUrl}`);
});

import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      google_id?: string | undefined;
      is_guest: boolean;
      email?: string | undefined;
      name?: string | undefined;
      picture?: string | undefined;
    };
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    console.log("Session missing user");
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  // Return session user info directly
  if (!req.session.user) {
    console.log(3);
    return res.status(401).json({ error: "Missing or invalid session user" });
  }
  console.log(4);
  res.json(req.session.user);
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/allUsersDebug", async (req: Request, res: Response) => {
  // This is just for debugging purposes to see all users in the DB. Remove in production!
  const users = await getAllUsersDebug();
  res.json(users);
});

export default router;
