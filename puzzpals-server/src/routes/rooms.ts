import { Router } from "express";
import { getRoomFromStore, createRoomInStore } from "../memorystore.js";
import { parsePuzzle } from "@puzzpals/puzzle-parser";

const router = Router();

function makeToken(length = 6) {
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
function generateToken() {
  let token;
  // Collision check
  for (let i = 0; i < 5; i++) {
    token = makeToken(6);
    const exists = getRoomFromStore(token);
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

    token = generateToken();
    if (token === null) {
      return res
        .status(500)
        .json({ error: "Could not create room, please try again" });
    }

    createRoomInStore(token, puzzle);
  } catch {
    return res.status(400).json({ error: "Invalid puzzle data" });
  }

  res.json({
    token: token,
  });
});

// Get room by token
router.get("/:token", (req, res) => {
  const { token } = req.params;
  const room = getRoomFromStore(token);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ room });
});

export default router;
