import express from "express";
import {
  addPuzzle,
  getPuzzles,
  getPuzzleById,
  getUserPuzzles,
  updatePuzzle,
} from "../db.js";
import type { UploadedPuzzle } from "../models/UploadedPuzzle.js";
import { parsePuzzle } from "@puzzpals/puzzle-parser";

const router = express.Router();

/*
 * Catalogue Fetch
 * - All published puzzles, sorted by newest first, with limit/offset params (default limit 10, max 100)
 * - Anyone can fetch, no auth required
 * - TODO: No solution data should be included in the response
 */

router.get("/", async (req, res) => {
  const rawLimit = req.query.limit;
  const rawOffset = req.query.offset;
  const limit =
    rawLimit === undefined || rawLimit === null || rawLimit === ""
      ? 10
      : Number(rawLimit);
  const offset =
    rawOffset === undefined || rawOffset === null || rawOffset === ""
      ? 0
      : Number(rawOffset);
  if (
    !Number.isFinite(limit) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    res.status(400).json({ error: "Invalid limit param" });
    return;
  }
  if (!Number.isFinite(offset) || !Number.isInteger(offset) || offset < 0) {
    res.status(400).json({ error: "Invalid offset param" });
    return;
  }
  try {
    const puzzles: UploadedPuzzle[] = await getPuzzles(limit, offset);
    res.json(puzzles);
  } catch {
    res.status(500).json({ error: "Failed to fetch puzzles" });
  }
});

/*
 * Puzzle Creation
 * - Only signed-in users can create puzzles
 * - Author_id is populated from session, not client input
 * - puzzleJson must be validated and parsable
 * - No caching for this endpoint
 */
router.post("/", async (req, res) => {
  if (!req.session.user || req.session.user.is_guest) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  const author_id = req.session.user.id;
  const payload = req.body as unknown;
  if (
    !(
      typeof payload === "object" &&
      payload !== null &&
      "author" in payload &&
      typeof payload.author === "string" &&
      "published" in payload &&
      typeof payload.published === "boolean" &&
      "puzzleJson" in payload
    )
  ) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  let parsedPuzzle;
  try {
    parsedPuzzle = parsePuzzle(payload.puzzleJson);
  } catch {
    return res.status(400).json({ error: "Invalid puzzleJson" });
  }
  try {
    const savedPuzzle = await addPuzzle(
      payload.author,
      author_id,
      parsedPuzzle,
      payload.published,
    );
    res.status(201).json(savedPuzzle);
  } catch {
    return res.status(500).json({ error: "Failed to save puzzle" });
  }
});

// Update a puzzle (draft or publish)
router.patch("/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  const author_id = req.session.user.id;
  const payload = req.body as unknown;
  if (
    !(
      typeof payload === "object" &&
      payload !== null &&
      "author" in payload &&
      typeof payload.author === "string" &&
      "published" in payload &&
      typeof payload.published === "boolean" &&
      "puzzleJson" in payload
    )
  ) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  let parsedPuzzle;
  try {
    parsedPuzzle = parsePuzzle(payload.puzzleJson);
  } catch {
    return res.status(400).json({ error: "Invalid puzzleJson" });
  }
  try {
    const updated = await updatePuzzle(
      id,
      author_id,
      payload.author,
      parsedPuzzle,
      payload.published,
    );
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Puzzle not found or not owned by user" });
    }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update puzzle" });
  }
});

/*
 * User Puzzles
 * - Fetch all puzzles created by the signed-in user, sorted by newest first
 * - Auth required, only returns puzzles where author_id matches session user id
 * - No caching for this endpoint
 */
router.get("/user", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  try {
    const puzzles = await getUserPuzzles(req.session.user.id);
    res.json(puzzles);
  } catch {
    res.status(500).json({ error: "Failed to fetch user's puzzles" });
  }
});

/*
 * Get Puzzle by ID
 * - Fetch a single puzzle by its ID
 * - If not auth, Only published puzzles are returned
 * - If auth, users can fetch their own unpublished puzzles, but not others' unpublished puzzles
 * - No caching for this endpoint
 */

router.get("/:id", async (req, res) => {
  const idParam = req.params.id;
  if (typeof idParam !== "string" || !/^[0-9]+$/.test(idParam)) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  try {
    const puzzle: UploadedPuzzle | null = await getPuzzleById(id);
    if (!puzzle) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    // If not authenticated, only allow published puzzles
    if (!req.session.user) {
      if (!puzzle.published) {
        return res.status(403).json({ error: "Puzzle not found" });
      }
      return res.json(puzzle);
    }
    // If authenticated, allow own unpublished puzzles, but not others'
    if (puzzle.published || puzzle.author_id === req.session.user.id) {
      return res.json(puzzle);
    } else {
      return res.status(403).json({ error: "Puzzle not found" });
    }
  } catch {
    return res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

/*
 * Get Puzzle by ID into Editor
 * - Fetch a single puzzle by its ID
 * - Auth required to fetch for editing
 * - No caching for this endpoint
 */

router.get("/:id/edit", async (req, res) => {
  const idParam = req.params.id;
  if (typeof idParam !== "string" || !/^[0-9]+$/.test(idParam)) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  try {
    const puzzle: UploadedPuzzle | null = await getPuzzleById(id);
    if (!puzzle) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    if (!req.session.user || puzzle.author_id !== req.session.user.id) {
      return res.status(403).json({ error: "Puzzle not found" });
    }
    return res.json(puzzle);
  } catch {
    return res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

export default router;
