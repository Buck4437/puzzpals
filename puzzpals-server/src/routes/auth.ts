import express from "express";
import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { google } from "googleapis";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { createHash, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import env from "../config.js";
import { upsertGoogleUser } from "../db.js";

const router = express.Router();

// Rate limiters for specific auth endpoints
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 login attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
});

const sessionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // more generous for session checks
  standardHeaders: true,
  legacyHeaders: false,
});

const logoutRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 logout attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Do NOT rate limit Google callback (to avoid blocking Google IPs)

interface SessionUser {
  id: number;
  google_id?: string | undefined;
  is_guest: boolean;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

const regenerateSession = (req: Request) =>
  new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) =>
      err
        ? reject(err instanceof Error ? err : new Error(String(err)))
        : resolve(),
    );
  });

const saveSession = (req: Request) =>
  new Promise<void>((resolve, reject) => {
    req.session.save((err) =>
      err
        ? reject(err instanceof Error ? err : new Error(String(err)))
        : resolve(),
    );
  });

const clearSessionCookie = (res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("connect.sid", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });
};

const destroySession = (req: Request) =>
  new Promise<void>((resolve, reject) => {
    req.session.destroy((err) =>
      err
        ? reject(err instanceof Error ? err : new Error(String(err)))
        : resolve(),
    );
  });

const clearAuthSession = async (req: Request, res: Response) => {
  try {
    await destroySession(req);
  } catch (err) {
    console.error("Failed to destroy session after auth failure:", err);
  }
  clearSessionCookie(res);
};

const toBase64Url = (input: Buffer) =>
  input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const normalizeReturnUrl = (returnUrl: string) =>
  !returnUrl.startsWith("/") || returnUrl.startsWith("//") ? "/" : returnUrl;

const buildClientRedirectUrl = (returnUrl: string) => {
  const normalizedReturnUrl = normalizeReturnUrl(returnUrl);
  const clientBase = new URL(env.CLIENT_BASE_URL);
  const basePath = clientBase.pathname.replace(/\/$/, "");
  if (
    basePath &&
    basePath !== "/" &&
    (normalizedReturnUrl === basePath ||
      normalizedReturnUrl.startsWith(`${basePath}/`))
  ) {
    return `${clientBase.origin}${normalizedReturnUrl}`;
  }
  return `${env.CLIENT_BASE_URL}${normalizedReturnUrl}`;
};

interface GoogleCredentials {
  web?: {
    client_secret?: string;
    client_id?: string;
    redirect_uris?: string[];
  };
  installed?: {
    client_secret?: string;
    client_id?: string;
    redirect_uris?: string[];
  };
}

let cachedOAuthConfig: {
  client_secret: string;
  client_id: string;
  redirect_uri: string;
} | null = null;

const loadOAuthConfigFromSplitEnv = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const hasAny = Boolean(clientId || clientSecret || redirectUri);

  if (!hasAny) {
    return null;
  }

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Partial Google OAuth split env vars detected. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI together.",
    );
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  };
};

const parseCredentials = (raw: string, source: string): GoogleCredentials => {
  try {
    return JSON.parse(raw) as GoogleCredentials;
  } catch {
    throw new Error(
      `Invalid Google OAuth credentials JSON from ${source}: failed to parse`,
    );
  }
};

const loadGoogleCredentials = (): GoogleCredentials => {
  try {
    return parseCredentials(
      readFileSync(join(process.cwd(), "credentials.json"), "utf-8"),
      "credentials.json",
    );
  } catch (err) {
    throw new Error(
      "Google OAuth credentials missing. Set environment variables or provide credentials.json",
      { cause: err },
    );
  }
};

const getoAuth2Client = (): OAuth2Client => {
  if (!cachedOAuthConfig) {
    const splitEnvConfig = loadOAuthConfigFromSplitEnv();
    if (splitEnvConfig) {
      cachedOAuthConfig = splitEnvConfig;
    } else {
      const credentials = loadGoogleCredentials();
      const oauthConfig = credentials.web ?? credentials.installed;
      if (!oauthConfig) {
        throw new Error(
          "Invalid Google OAuth credentials: missing web/installed config",
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
          "Invalid Google OAuth credentials: missing required client fields",
        );
      }
      cachedOAuthConfig = {
        client_secret,
        client_id,
        redirect_uri: redirect_uris[0],
      };
    }
  }

  const oauthConfig = cachedOAuthConfig;
  if (!oauthConfig) {
    throw new Error("Google OAuth credentials could not be loaded");
  }

  const { client_secret, client_id, redirect_uri } = oauthConfig;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
};

const SCOPES = ["profile", "email"];

router.get("/google/login", loginRateLimiter, async (req, res) => {
  try {
    const oauth2Client = getoAuth2Client();
    const rawReturnUrl =
      typeof req.query.returnUrl === "string" ? req.query.returnUrl : "/";
    const returnUrl = normalizeReturnUrl(rawReturnUrl);
    const oauthState = randomBytes(32).toString("hex");
    const codeVerifier = toBase64Url(randomBytes(32));
    const codeChallenge = toBase64Url(
      createHash("sha256").update(codeVerifier).digest(),
    );

    req.session.oauthState = oauthState;
    req.session.oauthReturnUrl = returnUrl;
    req.session.oauthCodeVerifier = codeVerifier;

    await saveSession(req);

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state: oauthState,
      code_challenge_method: CodeChallengeMethod.S256,
      code_challenge: codeChallenge,
    });
    res.redirect(url);
  } catch (err) {
    console.error("Google OAuth login initiation failed:", err);
    await clearAuthSession(req, res);
    res.status(500).json({ error: "Failed to start Google OAuth login" });
  }
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const returnUrl = req.session.oauthReturnUrl ?? "/";
  const expectedState = req.session.oauthState;
  const codeVerifier = req.session.oauthCodeVerifier;
  const providedState =
    typeof req.query.state === "string" ? req.query.state : "";

  delete req.session.oauthState;
  delete req.session.oauthReturnUrl;
  delete req.session.oauthCodeVerifier;

  if (
    !expectedState ||
    !providedState ||
    providedState !== expectedState ||
    !codeVerifier
  ) {
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    await clearAuthSession(req, res);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent("invalid_state")}`,
    );
  }

  // Google returns an error query param (for example access_denied) when user aborts sign-in.
  const oauthError =
    typeof req.query.error === "string" ? req.query.error : null;
  if (oauthError) {
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    await clearAuthSession(req, res);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent(oauthError)}`,
    );
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    await clearAuthSession(req, res);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent("missing_code")}`,
    );
  }

  try {
    const oauth2Client = getoAuth2Client();
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier,
    });
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

    // Rotate session ID after successful authentication to prevent fixation.
    await regenerateSession(req);

    const sessionUser: SessionUser = {
      id: dbUser.id,
      google_id: dbUser.google_id,
      is_guest: false,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture,
    };

    req.session.user = sessionUser;
    await saveSession(req);

    return res.redirect(buildClientRedirectUrl(returnUrl));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    await clearAuthSession(req, res);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent("oauth_callback_failed")}`,
    );
  }
});

router.get("/session", sessionRateLimiter, (req: Request, res: Response) => {
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

router.post("/logout", logoutRateLimiter, (req, res) => {
  req.session.destroy(() => {
    clearSessionCookie(res);
    // Prevent browser caching after logout
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.json({ success: true });
  });
});

import "express-session";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    oauthReturnUrl?: string;
    oauthCodeVerifier?: string;
    user?: SessionUser;
  }
}

export default router;
