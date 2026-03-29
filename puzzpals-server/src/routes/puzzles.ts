import express from "express";
import { addPuzzle, getPuzzles, getPuzzleById } from "../db.js";
import type { Puzzle } from "../models/Puzzle.js";
import { parsePuzzle } from "@puzzpals/puzzle-parser";

const router = express.Router();

// Get all puzzles
router.get("/", async (req, res) => {
  const limit = Number(req.query.limit);
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
    payload.author,
    payload.description,
    parsedPuzzle,
  );

  res.status(201).json(savedPuzzle);
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

export default router;
