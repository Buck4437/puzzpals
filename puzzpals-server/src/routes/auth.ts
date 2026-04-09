import express from "express";
import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { google } from "googleapis";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import env from "../config.js";
import { upsertGoogleUser } from "../db.js";
import {
  createPersistentBearerToken,
  getBearerTokenFromRequest,
  verifyPersistentBearerToken,
  type SessionUser,
} from "../util/authUtil.js";

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const ticketRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const sessionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
});

const logoutRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

interface LoginTicketPayload {
  exp: number;
  user: SessionUser;
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function toBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  return Buffer.from(`${base64}${"=".repeat(padding)}`, "base64");
}

function normalizeReturnUrl(returnUrl: string): string {
  if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return "/";
  }
  return returnUrl;
}

function buildClientRedirectUrl(returnUrl: string): string {
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
}

function appendQueryParam(
  urlString: string,
  key: string,
  value: string,
): string {
  const url = new URL(urlString);
  url.searchParams.set(key, value);
  return url.toString();
}

function getSessionSigningSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-session-secret";
}

function createLoginTicket(user: SessionUser): string {
  const payload: LoginTicketPayload = {
    exp: Date.now() + 1000 * 60 * 2,
    user,
  };
  const encodedPayload = toBase64Url(
    Buffer.from(JSON.stringify(payload), "utf-8"),
  );
  const signature = toBase64Url(
    createHmac("sha256", getSessionSigningSecret())
      .update(encodedPayload)
      .digest(),
  );
  return `${encodedPayload}.${signature}`;
}

function parseLoginTicket(ticket: string): SessionUser | null {
  const [encodedPayload, providedSignature, ...rest] = ticket.split(".");
  if (!encodedPayload || !providedSignature || rest.length > 0) {
    return null;
  }

  const expectedSignature = toBase64Url(
    createHmac("sha256", getSessionSigningSecret())
      .update(encodedPayload)
      .digest(),
  );

  const providedSigBuffer = Buffer.from(providedSignature, "utf-8");
  const expectedSigBuffer = Buffer.from(expectedSignature, "utf-8");
  if (providedSigBuffer.length !== expectedSigBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(providedSigBuffer, expectedSigBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf-8"),
    ) as LoginTicketPayload;

    if (!parsed || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    if (!parsed.user || typeof parsed.user.id !== "number") {
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
}

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

function loadOAuthConfigFromSplitEnv() {
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
}

function parseCredentials(raw: string, source: string): GoogleCredentials {
  try {
    return JSON.parse(raw) as GoogleCredentials;
  } catch {
    throw new Error(
      `Invalid Google OAuth credentials JSON from ${source}: failed to parse`,
    );
  }
}

function loadGoogleCredentials(): GoogleCredentials {
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
}

function getoAuth2Client(): OAuth2Client {
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
}

const SCOPES = ["profile", "email"];

router.get("/google/login", loginRateLimiter, (req, res) => {
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

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: oauthState,
    code_challenge_method: CodeChallengeMethod.S256,
    code_challenge: codeChallenge,
  });
  res.redirect(url);
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
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent("invalid_state")}`,
    );
  }

  const oauthError =
    typeof req.query.error === "string" ? req.query.error : null;
  if (oauthError) {
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent(oauthError)}`,
    );
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    const redirectUrl = buildClientRedirectUrl(returnUrl);
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

    const googleId = userInfo.data.id ?? "";
    const dbUser = await upsertGoogleUser(
      googleId,
      userInfo.data.email || "",
      userInfo.data.name || "",
      userInfo.data.picture || "",
    );

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

    const redirectUrl = appendQueryParam(
      buildClientRedirectUrl(returnUrl),
      "loginTicket",
      createLoginTicket(sessionUser),
    );

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    const redirectUrl = buildClientRedirectUrl(returnUrl);
    return res.redirect(
      `${redirectUrl}?authError=${encodeURIComponent("oauth_callback_failed")}`,
    );
  }
});

router.get(
  "/session",
  sessionRateLimiter,
  async (req: Request, res: Response) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );

    if (req.session.user) {
      return res
        .status(200)
        .json({ authenticated: true, data: req.session.user });
    }

    const bearerToken = getBearerTokenFromRequest(req);
    if (bearerToken) {
      const bearerUser = verifyPersistentBearerToken(bearerToken);
      if (bearerUser) {
        const { id, google_id, email, name, picture, is_guest } = bearerUser;
        return res.status(200).json({
          authenticated: true,
          data: { id, google_id, email, name, picture, is_guest },
        });
      }

      return res.status(401).json({
        authenticated: false,
        data: null,
        error: "invalid_or_expired_token",
      });
    }

    return res.status(200).json({ authenticated: false, data: null });
  },
);

router.post(
  "/ticket/exchange",
  ticketRateLimiter,
  async (req: Request, res: Response) => {
    const ticket = typeof req.body?.ticket === "string" ? req.body.ticket : "";
    const issueBearerToken = req.body?.issueBearerToken === true;
    const sessionUser = parseLoginTicket(ticket);

    if (!sessionUser) {
      return res
        .status(400)
        .json({ success: false, error: "invalid_or_expired_ticket" });
    }

    if (issueBearerToken) {
      const persistentBearerToken = createPersistentBearerToken(sessionUser);
      return res.status(200).json({
        success: true,
        persistentBearerToken,
      });
    }

    try {
      await regenerateSession(req);
      req.session.user = sessionUser;
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({
        success: false,
        error: "session_establishment_failed",
      });
    }
  },
);

router.post("/logout", logoutRateLimiter, (req, res) => {
  req.session.destroy(() => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.json({ success: true });
  });
});

export default router;
