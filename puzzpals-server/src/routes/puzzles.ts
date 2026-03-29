import express from "express";
import {
  addPuzzle,
  getPuzzles,
  getPuzzleById,
  getUserPuzzles,
  updatePuzzle,
} from "../db.js";
import type { Puzzle } from "../models/Puzzle.js";
import { parsePuzzle } from "@puzzpals/puzzle-parser";
// import { auth } from "google-auth-library";

const router = express.Router();

// function stripSolutionFromPuzzle(puzzle: Puzzle): Puzzle {
//   if (!puzzle || typeof puzzle !== "object") {
//     return puzzle;
//   }
//   const puzzleJson = puzzle.puzzle_json;
//   if (!puzzleJson || typeof puzzleJson !== "object") {
//     return puzzle;
//   }
//   const puzzleClone = structuredClone(puzzleJson)
//   if (puzzleClone.solution) {
//     delete puzzleClone.solution;
//   }
//   return {
//     ...puzzle,
//     puzzle_json: restPuzzleJson,
//   };
// }

// Get all puzzles
router.get("/", async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  if (
    !Number.isFinite(limit) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    res.status(400).json({ error: "Invalid limit param" });
    return;
  }
  try {
    const puzzles: Puzzle[] = await getPuzzles(limit);
    res.json(puzzles);
  } catch {
    res.status(500).json({ error: "Failed to fetch puzzles" });
  }
});

// Add a new puzzle
router.post("/", async (req, res) => {
  // Restrict to signed-in users only
  if (!req.session.user || req.session.user.is_guest) {
    return res
      .status(403)
      .json({ error: "Only signed-in users can publish puzzles." });
  }
  // Prevent browser caching for this endpoint
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );

  // Populate author and author_id from session
  const author = req.session.user.name || req.session.user.email || "Unknown";
  const author_id = req.session.user.id;
  const payload = req.body as unknown;

  if (
    !(
      typeof payload === "object" &&
      payload !== null &&
      "title" in payload &&
      typeof payload.title === "string" &&
      "author" in payload &&
      typeof payload.author === "string" &&
      "description" in payload &&
      typeof payload.description === "string" &&
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

  const savedPuzzle = await addPuzzle(
    payload.title,
    author,
    author_id,
    payload.description,
    parsedPuzzle,
    payload.published,
  );

  res.status(201).json(savedPuzzle);
});

// Get all puzzles for a user
router.get("/user", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  // Prevent browser caching for this endpoint
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

// Get puzzle by id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  try {
    const puzzle = await getPuzzleById(id);
    if (!puzzle) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    res.json(puzzle);
  } catch {
    res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

// Update a puzzle (draft or publish)
router.patch("/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  const author_id = req.session.user.id;
  const { description, puzzle_json, published, publish_date } = req.body;
  try {
    const updated = await updatePuzzle(id, author_id, {
      description,
      puzzle_json,
      published,
      publish_date,
    });
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

export default router;
