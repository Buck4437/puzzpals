import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

vi.mock("../pool.js");

const validPayload = {
  size: [1, 1],
  problem: {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  },
  options: {
    rules: [],
  },
};

describe("Create room API", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  it("can create room", async () => {
    const res = await request(app).post("/api/rooms/create").send(validPayload);
    expect(res.ok).toBe(true);

    // Room token specification: 10 character alphanumeric
    expect(res.body.token).toMatch(/^[a-zA-Z0-9]{10}$/);
  });
});

describe("Check room existence API", () => {
  it("returns true when room exists", async () => {
    const res1 = await request(app)
      .post("/api/rooms/create")
      .send(validPayload);
    const res2 = await request(app).get(`/api/rooms/${res1.body.token}/exists`);
    expect(res2.body.exists).toBe(true);
  });

  it("returns false when room does not exist", async () => {
    const res = await request(app).get("/api/rooms/abcdefghij/exists");
    expect(res.body.exists).toBe(false);
  });
});
