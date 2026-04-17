import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";

import { puzzleData } from "./utils/objects.js";

describe("/api/rooms/create", () => {
  it("can create room", async () => {
    const res = await request(app).post("/api/rooms/create").send(puzzleData);
    expect(res.ok).toBe(true);

    // Room token specification: 10 character alphanumeric
    expect(res.body.token).toMatch(/^[a-zA-Z0-9]{10}$/);
  });
});

describe("/api/rooms/:token/exists", () => {
  it("returns true when room exists", async () => {
    const res1 = await request(app).post("/api/rooms/create").send(puzzleData);
    const res2 = await request(app).get(`/api/rooms/${res1.body.token}/exists`);
    expect(res2.body.exists).toBe(true);
  });

  it("returns false when room does not exist", async () => {
    const res = await request(app).get("/api/rooms/abcdefghij/exists");
    expect(res.body.exists).toBe(false);
  });
});
