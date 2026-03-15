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
    symbolObjects: {},
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

describe("Get room API", () => {
  it("succeeds when room exists", async () => {
    const res1 = await request(app)
      .post("/api/rooms/create")
      .send(validPayload);
    const res2 = await request(app).get(`/api/rooms/${res1.body.token}`);
    expect(res2.ok).toBe(true);
  });

  it("responds 404 when room does not exist", async () => {
    const res = await request(app).get("/api/rooms/abcdefghij");
    expect(res.notFound).toBe(true);
  });
});
