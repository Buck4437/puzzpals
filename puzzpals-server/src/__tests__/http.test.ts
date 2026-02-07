import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import app from "../app.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

const validPayload = {
  type: "akari",
  grid: [
    [".", "2"],
    ["#", "."],
  ],
};

describe("Create room API", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  it("can create room", async () => {
    const res = await request(app).post("/api/rooms/create").send(validPayload);
    expect(res.ok).toBe(true);

    // Room token specification: 6 character alphanumeric
    expect(res.body.token).toMatch(/^[a-zA-Z0-9]{6}$/);
  });

  async function assertBadRequest(payload?: string | object) {
    const res = await request(app).post("/api/rooms/create").send(payload);
    expect(res.badRequest).toBe(true);
  }

  it("rejects request missing payload", async () => {
    await assertBadRequest();
  });

  it("rejects wrong payload type", async () => {
    await assertBadRequest("Hello, world!");
  });

  it('rejects payload missing "type"', async () => {
    await assertBadRequest({
      grid: [
        [".", "2"],
        ["#", "."],
      ],
    });
  });

  it('rejects payload missing "grid"', async () => {
    await assertBadRequest({
      type: "akari",
    });
  });

  it('rejects wrong "type" type', async () => {
    await assertBadRequest({
      type: 0,
      grid: [
        [".", "2"],
        ["#", "."],
      ],
    });
  });

  it('rejects wrong "type" value', async () => {
    await assertBadRequest({
      type: "masyu",
      grid: [
        [".", "2"],
        ["#", "."],
      ],
    });
  });

  it('rejects wrong "grid" type', async () => {
    await assertBadRequest({
      type: "akari",
      grid: "Hello, world!",
    });
  });

  it("rejects empty grid", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [],
    });
  });

  it("rejects wrong row type", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [".", "2", "#", "."],
    });
  });

  it("rejects empty row", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [[]],
    });
  });

  it("rejects non-rectangular grid", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [[".", "2"], ["#"]],
    });
  });

  it("rejects wrong cell type", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [
        [".", 2],
        ["#", "."],
      ],
    });
  });

  it("rejects wrong cell value", async () => {
    await assertBadRequest({
      type: "akari",
      grid: [
        [".", "5"],
        ["#", "."],
      ],
    });
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
    const res = await request(app).get("/api/rooms/TestRm");
    expect(res.notFound).toBe(true);
  });
});
