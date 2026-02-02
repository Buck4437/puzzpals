import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import request from "supertest";

import app from "src/app.js";
import { arrangeBeforeEach, cleanUpAfterEach } from "./utils/arrange.js";

describe("Create room API", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  it("can create room", async () => {
    const payload = {
      "type": "akari",
      "grid": [[".", "2"], ["#", "."]]
    };

    const res = await request(app).post("/api/rooms/create").send(payload);
    assert.ok(res.ok);

    // Room token specification: 6 character alphanumeric
    assert.match(res.body.token, /^[a-zA-Z0-9]{6}$/);
  });

  async function assertBadRequest(payload?: string | object) {
    const res = await request(app).post("/api/rooms/create").send(payload);
    assert.ok(res.badRequest);
  }

  it("rejects request missing payload", async () => {
    await assertBadRequest();
  });

  it("rejects wrong payload type", async () => {
    await assertBadRequest("Hello, world!");
  });

  it("rejects payload missing \"type\"", async () => {
    await assertBadRequest({
      "grid": [[".", "2"], ["#", "."]]
    });
  });

  it("rejects payload missing \"grid\"", async () => {
    await assertBadRequest({
      "type": "akari"
    });
  });

  it("rejects wrong \"type\" type", async () => {
    await assertBadRequest({
      "type": 0,
      "grid": [[".", "2"], ["#", "."]]
    });
  });

  it("rejects wrong \"type\" value", async () => {
    await assertBadRequest({
      "type": "masyu",
      "grid": [[".", "2"], ["#", "."]]
    });
  });

  it("rejects wrong \"grid\" type", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": "Hello, world!"
    });
  });

  it("rejects empty grid", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": []
    });
  });

  it("rejects wrong row type", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": [".", "2", "#", "."]
    });
  });

  it("rejects empty row", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": [[]]
    });
  });

  it("rejects non-rectangular grid", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": [[".", "2"], ["#"]]
    });
  });

  it("rejects wrong cell type", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": [[".", 2], ["#", "."]]
    });
  });

  it("rejects wrong cell value", async () => {
    await assertBadRequest({
      "type": "akari",
      "grid": [[".", "5"], ["#", "."]]
    });
  });
});

describe("Join room API", () => {
  beforeEach(arrangeBeforeEach);
  afterEach(cleanUpAfterEach);

  it("can join players to rooms", async () => {
    const payload = {
      "type": "akari",
      "grid": [[".", "2"], ["#", "."]]
    };

    const createRes = await request(app).post("/api/rooms/create").send(payload);
    const token = createRes.body.token;

    const joinRes = await request(app).post(`/api/rooms/${token}/join`);
    assert.equal(joinRes.status, 200);
  });

  it("rejects request to join non-existent room", async () => {
    const res = await request(app).post(`/api/rooms/TestRm/join`);
    assert.equal(res.status, 404);
  });
});