import { Router } from "express";
import type { PuzzleMetadata } from "../db.js";
import {
  getPuzzleById,
  getPuzzleMetadata,
  getPuzzleTotalNum,
  upsertPuzzle,
} from "../db.js";
import { parsePuzzle, serialize } from "@puzzpals/puzzle-parser";

const router = Router();

function parseCtlgSearchParams(
  query: Record<string, unknown>,
): PuzzleMetadata | null {
  const { sortBy, sortDir, title, rowRange } = query;
  if (
    typeof sortBy !== "string" ||
    typeof sortDir !== "string" ||
    typeof title !== "string" ||
    typeof rowRange !== "string"
  ) {
    return null;
  }
  const sortDirNum = parseInt(sortDir);
  const rowRangeNum = parseInt(rowRange);
  if (isNaN(sortDirNum) || isNaN(rowRangeNum)) {
    return null;
  }
  return {
    sortBy: sortBy,
    sortDir: sortDirNum,
    title: title,
    rowRange: rowRangeNum,
  };
}

router.get("/ctlgSearch", (req, res) => {
  const metadata = parseCtlgSearchParams(req.query as Record<string, unknown>);
  if (!metadata) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const results = getPuzzleMetadata(metadata);
  const recordCnt = getPuzzleTotalNum(metadata);
  const hasNextRow = metadata.rowRange < recordCnt;
  const rr = metadata.rowRange;
  res.json({
    results: results,
    hasNextRow: hasNextRow,
    rowRange: rr,
    loadedRecord: results.length,
    recordCnt: recordCnt,
  });
});

router.post("/upload", (req, res) => {
  const { title, puzzleData } = req.body;
  const parsedPuzzle = (() => {
    try {
      return parsePuzzle(puzzleData);
    } catch {
      return null;
    }
  })();
  if (!parsedPuzzle) {
    return res.status(400).json({ error: "Invalid puzzle data" });
  }
  let newTitle = title;
  if (!newTitle || typeof newTitle !== "string" || newTitle.trim() === "") {
    newTitle = `Puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  } else {
    newTitle = newTitle.trim();
  }

  const pId = crypto.randomUUID();
  const serializedPuzzle = serialize(parsedPuzzle);
  try {
    upsertPuzzle(pId, newTitle, serializedPuzzle);
    res.status(201).json({
      message: "Puzzle uploaded successfully",
      pId: pId,
      title: newTitle,
    });
  } catch (e) {
    console.error("Error uploading puzzle:", e);
    return res.status(500).json({ error: "Failed to upload puzzle" });
  }
});

router.get("/idSearch", (req, res) => {
  const { pId } = req.query;
  if (typeof pId !== "string" || pId.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing pId parameter" });
  }
  const puzzle = getPuzzleById(pId);
  if (!puzzle) {
    return res.status(404).json({ error: "Puzzle not found" });
  }
  res.json({ puzzle });
});

export default router;
