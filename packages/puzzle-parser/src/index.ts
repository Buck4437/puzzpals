import { parse as parseAkari } from "./parsers/AkariParser.js";
import { type Grid } from "./types/Akari.js";
import { serialize, deserialize } from "./parsers/AkariParser.js";
import puzzle from "./demo-puzzles/akari1.json" with { type: "json" };

function createEmptyGrid(): Grid {
  return parseAkari(puzzle) 
}

function parsePuzzle(input: any): Grid {
  return parseAkari(input);
}

export { createEmptyGrid, parsePuzzle, type Grid, serialize, deserialize };