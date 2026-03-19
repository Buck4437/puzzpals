import express from "express";
import { addPuzzle, getPuzzles, getPuzzleById } from "../db.js";
import type { Puzzle } from "../models/Puzzle.js";

const router = express.Router();

// Get all puzzles
router.get("/", async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 0) {
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
  // Populate author and author_id from session
  const author = req.session.user.name || req.session.user.email || "Unknown";
  const author_id = req.session.user.id;
  const { description, puzzle_json, publish_date } = req.body;
  if (!puzzle_json) {
    return res.status(400).json({ error: "Missing puzzle_json" });
  }
  try {
    let dateObj;
    if (publish_date) {
      dateObj = new Date(publish_date);
      if (isNaN(dateObj.getTime())) dateObj = new Date();
    } else {
      dateObj = new Date();
    }
    // Pass author and author_id to addPuzzle
    const puzzle = await addPuzzle(
      author,
      author_id,
      description || "",
      puzzle_json,
      dateObj,
    );
    res.status(201).json(puzzle);
  } catch (err) {
    console.error("Error adding puzzle:", err);
    const details =
      err && typeof err === "object" && "message" in err
        ? (err as Error).message
        : String(err);
    res.status(500).json({ error: "Failed to add puzzle", details });
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

export default router;
