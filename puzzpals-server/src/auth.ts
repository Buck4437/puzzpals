import express from "express";
import type { Request, Response } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFileSync } from "fs";
import env from "./config.js";
import { upsertGoogleUser } from "./db.js";

const router = express.Router();

function getoAuth2Client(): OAuth2Client {
  const credentials = JSON.parse(readFileSync("credentials.json", "utf-8"));
  const oauthConfig = credentials.web ?? credentials.installed;
  if (!oauthConfig) {
    throw new Error(
      "Invalid OAuth credentials file: missing web/installed config",
    );
  }
  const { client_secret, client_id, redirect_uris } = oauthConfig;
  if (
    !client_secret ||
    !client_id ||
    !Array.isArray(redirect_uris) ||
    !redirect_uris[0]
  ) {
    throw new Error(
      "Invalid OAuth credentials file: missing required client fields",
    );
  }
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
  const returnUrl = typeof req.query.state === "string" ? req.query.state : "/";

  // Google returns an error query param (for example access_denied) when user aborts sign-in.
  const oauthError =
    typeof req.query.error === "string" ? req.query.error : null;
  if (oauthError) {
    return res.redirect(
      `${env.CLIENT_BASE_URL}${returnUrl}?authError=${encodeURIComponent(oauthError)}`,
    );
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    return res.redirect(
      `${env.CLIENT_BASE_URL}${returnUrl}?authError=${encodeURIComponent("missing_code")}`,
    );
  }

  try {
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

    req.session.user = {
      id: dbUser.id,
      google_id: dbUser.google_id,
      is_guest: false,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture,
    };
    return res.redirect(`${env.CLIENT_BASE_URL}${returnUrl}`);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return res.redirect(
      `${env.CLIENT_BASE_URL}${returnUrl}?authError=${encodeURIComponent("oauth_callback_failed")}`,
    );
  }
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

router.get("/session", async (req: Request, res: Response) => {
  // Prevent browser caching for this endpoint
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  if (!req.session.user) {
    return res.status(200).json({ authenticated: false, data: null });
  }
  res.status(200).json({ authenticated: true, data: req.session.user });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    // Prevent browser caching after logout
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.json({ success: true });
  });
});

// router.get("/allUsersDebug", async (req: Request, res: Response) => {
//   // This is just for debugging purposes to see all users in the DB. Remove in production!
//   const users = await getAllUsersDebug();
//   res.json(users);
// });

export default router;
