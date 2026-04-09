import type { Request } from "express";
import { createHmac } from "crypto";

export interface SessionUser {
  id: number;
  google_id?: string | undefined;
  is_guest: boolean;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

function isSessionUser(value: unknown): value is SessionUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SessionUser).id === "number" &&
    typeof (value as SessionUser).is_guest === "boolean"
  );
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

function parseJwt(
  token: string,
): { header: unknown; payload: unknown; signature: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  if (
    headerPart === undefined ||
    payloadPart === undefined ||
    signaturePart === undefined
  ) {
    return null;
  }

  try {
    return {
      header: JSON.parse(fromBase64Url(headerPart).toString("utf-8")),
      payload: JSON.parse(fromBase64Url(payloadPart).toString("utf-8")),
      signature: signaturePart,
    };
  } catch {
    return null;
  }
}

function signJwt(payload: SessionUser, secret: string): string {
  const header = toBase64Url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }), "utf-8"),
  );
  const body = toBase64Url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const signature = toBase64Url(
    createHmac("sha256", secret).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

export function createPersistentBearerToken(user: SessionUser): string {
  const secret = process.env.JWT_SECRET || "dev-only-jwt-secret";
  return signJwt(
    {
      id: user.id,
      google_id: user.google_id,
      is_guest: user.is_guest,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    secret,
  );
}

export function verifyPersistentBearerToken(token: string): SessionUser | null {
  const secret = process.env.JWT_SECRET || "dev-only-jwt-secret";

  try {
    const parsed = parseJwt(token);
    if (!parsed || !isSessionUser(parsed.payload)) {
      return null;
    }

    const expectedSignature = toBase64Url(
      createHmac("sha256", secret)
        .update(
          `${toBase64Url(Buffer.from(JSON.stringify(parsed.header), "utf-8"))}.${toBase64Url(Buffer.from(JSON.stringify(parsed.payload), "utf-8"))}`,
        )
        .digest(),
    );
    if (expectedSignature !== parsed.signature) {
      return null;
    }

    const decoded = parsed.payload;
    return {
      id: decoded.id,
      google_id: decoded.google_id,
      is_guest: decoded.is_guest,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch {
    return null;
  }
}

export function getBearerTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
}

export function getAuthenticatedUser(req: Request): SessionUser | null {
  if (req.session.user) {
    return req.session.user;
  }

  const token = getBearerTokenFromRequest(req);
  if (!token) {
    return null;
  }

  return verifyPersistentBearerToken(token);
}

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
  }
}

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    oauthReturnUrl?: string;
    oauthCodeVerifier?: string;
    user?: SessionUser;
  }
}
