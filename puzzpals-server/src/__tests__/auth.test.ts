import { createHmac } from "crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

vi.mock("../pool.js");

interface SessionUser {
  id: number;
  google_id?: string;
  is_guest: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

function toBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwt(payload: SessionUser, secret = "dev-only-jwt-secret"): string {
  const header = toBase64Url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }), "utf-8"),
  );
  const body = toBase64Url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const signature = toBase64Url(
    createHmac("sha256", secret).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

function signLoginTicket(
  user: SessionUser,
  secret = "dev-only-session-secret",
): string {
  const payload = {
    exp: Date.now() + 1000 * 60 * 2,
    user,
  };
  const body = toBase64Url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const signature = toBase64Url(
    createHmac("sha256", secret).update(body).digest(),
  );
  return `${body}.${signature}`;
}

describe("Auth API", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  it("does not issue a bearer token when session exchange succeeds", async () => {
    const sessionUser: SessionUser = {
      id: 123,
      google_id: "google-123",
      is_guest: false,
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/avatar.png",
    };
    const ticket = signLoginTicket(sessionUser);

    const response = await request(app)
      .post("/api/auth/ticket/exchange")
      .send({ ticket });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.persistentBearerToken).toBeUndefined();
  });

  it("issues a bearer token via explicit ticket exchange fallback", async () => {
    const sessionUser: SessionUser = {
      id: 321,
      google_id: "google-321",
      is_guest: false,
      email: "fallback@example.com",
      name: "Fallback User",
      picture: "https://example.com/fallback.png",
    };
    const ticket = signLoginTicket(sessionUser);

    const response = await request(app)
      .post("/api/auth/ticket/exchange")
      .send({ ticket, issueBearerToken: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.persistentBearerToken).toBe("string");
  });

  it("accepts bearer-token auth for session lookup", async () => {
    const token = signJwt({
      id: 456,
      google_id: "google-456",
      is_guest: false,
      email: "bearer@example.com",
      name: "Bearer User",
      picture: "https://example.com/bearer.png",
    });

    const response = await request(app)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.data).toMatchObject({
      id: 456,
      google_id: "google-456",
      is_guest: false,
      email: "bearer@example.com",
      name: "Bearer User",
      picture: "https://example.com/bearer.png",
    });
  });

  it("lets bearer-authenticated requests reach protected puzzle routes", async () => {
    const token = signJwt({
      id: 789,
      google_id: "google-789",
      is_guest: false,
      email: "editor@example.com",
      name: "Editor User",
      picture: "https://example.com/editor.png",
    });

    const response = await request(app)
      .post("/api/puzzles")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid payload");
  });
});
