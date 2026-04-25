import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../app.js";
import type { UploadedPuzzle } from "../models/UploadedPuzzle.js";
import pool from "../pool.js";

import { puzzleData, uploadedPuzzle } from "./utils/objects.js";

const mockPool = vi.mocked(pool);

function setQueryResolveValue(rows: unknown[]) {
  // @ts-expect-error, TypeScript can't type this mock
  mockPool.query.mockResolvedValueOnce({ rows });
}

describe("/create", () => {
  it("can create room", async () => {
    const res = await request(app).post("/api/rooms/create").send(puzzleData);
    expect(res.ok).toBe(true);

    // Room token specification: 10 character alphanumeric
    expect(res.body.token).toMatch(/^[a-zA-Z0-9]{10}$/);
  });
});

describe("/create-from-id", () => {
  it("can create room", async () => {
    // Uploaded puzzle exists in database
    setQueryResolveValue([uploadedPuzzle]);

    const res = await request(app)
      .post("/api/rooms/create-from-id")
      .send({ puzzleId: 42 });

    expect(res.ok).toBe(true);
  });

  it("fails if payload is invalid", async () => {
    const res = await request(app)
      .post("/api/rooms/create-from-id")
      .send({ puzzleId: "<script>" });

    expect(res.ok).toBe(false);
  });

  it("fails if puzzle does not exist", async () => {
    // Uploaded puzzle does not exist
    setQueryResolveValue([]);

    const res = await request(app)
      .post("/api/rooms/create-from-id")
      .send({ puzzleId: 42 });

    expect(res.ok).toBe(false);
  });

  it("fails if puzzle is private", async () => {
    const privatePuzzle: UploadedPuzzle = {
      ...uploadedPuzzle,
      published: false,
    };
    setQueryResolveValue([privatePuzzle]);

    const res = await request(app)
      .post("/api/rooms/create-from-id")
      .send({ puzzleId: 42 });

    expect(res.ok).toBe(false);
  });

  it.skip("succeeds if private puzzle belong to user", () => {
    // TODO
  });
});

describe("/:token/exists", () => {
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
