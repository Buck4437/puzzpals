import type { GameData, PuzzleData } from "@puzzpals/puzzle-models";

import type { UploadedPuzzle } from "../../models/UploadedPuzzle.js";

export const puzzleData: PuzzleData = {
  title: "Test title",
  instructions: "Test instructions",
  size: [1, 1],
  problem: {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  },
  options: {
    rules: [],
  },
};

export const uploadedPuzzle: UploadedPuzzle = {
  id: 42,
  author: "Test author",
  author_id: 0,
  description: "Test description",
  puzzle_json: puzzleData,
  publish_date: new Date(0),
  published: true,
};

export const gameData: GameData = {
  puzzle: puzzleData,
  playerSolution: {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  },
};
