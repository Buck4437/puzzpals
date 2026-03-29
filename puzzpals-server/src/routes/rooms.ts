import { Router } from "express";
import { getRoomFromStore, createRoomInStore } from "../memorystore.js";
import { parsePuzzle, createEmptyLayerData } from "@puzzpals/puzzle-parser";
import type { GameData } from "@puzzpals/puzzle-models";

const router = Router();

function makeToken() {
  const length = 10;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (const byte of bytes) {
    result += chars[byte % chars.length];
  }
  return result;
}

// TODO: Fix concurrency issue where token has a very small chance of clashing
async function generateToken() {
  let token;
  // Collision check
  for (let i = 0; i < 5; i++) {
    token = makeToken();
    const exists = await getRoomFromStore(token);
    if (!exists) {
      return token;
    }
  }
  return null;
}

// Create room by uploading a file
router.post("/create", async (req, res) => {
  // Test parse file
  const puzzleData: unknown = req.body;
  let token;
  try {
    const puzzle = parsePuzzle(puzzleData);

    const gameData = {
      puzzle,
      playerSolution: createEmptyLayerData(),
    } as GameData;

    token = await generateToken();
    if (token === null) {
      return res
        .status(500)
        .json({ error: "Could not create room, please try again" });
    }

    createRoomInStore({ token: token, puzzle_data: gameData });
  } catch (err) {
    console.log("Error creating room:", (err as Error).message);
    return res.status(400).json({ error: "Invalid puzzle data" });
  }

  res.json({ token: token });
});

// Create room from puzzle ID in DB
router.post("/create-from-id", async (req, res) => {
  const { puzzleId } = req.body;
  if (!puzzleId || typeof puzzleId !== "number" || puzzleId < 0) {
    return res.status(400).json({ error: "Invalid puzzle id" });
  }
  try {
    const { getPuzzleById } = await import("../db.js");
    const puzzle = await getPuzzleById(puzzleId);
    if (!puzzle || !puzzle.puzzle_json) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    const { parsePuzzle, createEmptyLayerData } =
      await import("@puzzpals/puzzle-parser");
    const parsedPuzzle = parsePuzzle(puzzle.puzzle_json);
    const gameData = {
      puzzle: parsedPuzzle,
      playerSolution: createEmptyLayerData(),
    } as GameData;
    const token = await generateToken();
    if (token === null) {
      return res
        .status(500)
        .json({ error: "Could not create room, please try again" });
    }
    createRoomInStore({ token: token, puzzle_data: gameData });
    res.json(token);
  } catch (err) {
    console.log(
      "Error creating room from id:",
      err instanceof Error ? err.message : err,
    );
    res.status(500).json({ error: "Failed to create room from puzzle id" });
  }
});

// Check room existence
router.get("/:token/exists", async (req, res) => {
  const { token } = req.params;

  // Return if token length is incorrect, saving a memory lookup
  if (token.length !== 10) {
    return res.json({ exists: false });
  }

  try {
    const room = await getRoomFromStore(token);
    return res.json({ exists: room !== null });
  } catch (err) {
    console.log("Error fetching room:", (err as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
