import { join } from "path";
import Database from "better-sqlite3";
import type { Room } from "./models/Room.js";

export type DB = InstanceType<typeof Database>;

let db: DB | null = null;

function initDb(dbPath?: string) {
  const file = dbPath ?? join(process.cwd(), "puzzpals-data.db");
  db = new Database(file);
  console.log("sqlite initialized at", file);
  createTable();
  initPuzzleTable();
}

function createTable() {
  if (!db) {
    console.error(
      "Failed to create tables: database is not initialized. Call initDb() before using the database.",
    );
    throw new Error("Cannot create tables: database is not initialized.");
  }
  const sql = `CREATE TABLE IF NOT EXISTS Room (
        token TEXT PRIMARY KEY UNIQUE,
        puzzle_data TEXT
    )`;
  db.prepare(sql).run();
}

function upsertRoom(token: string, puzzleJson: string) {
  const sql = `INSERT OR REPLACE INTO Room (token, puzzle_data) VALUES (?, ?)`;
  db?.prepare(sql).run(token, puzzleJson);
}

function fetchRoom(token: string) {
  const sql = "SELECT * FROM Room WHERE token = ?";
  const row = db?.prepare(sql).get(token) as Room | undefined;
  if (!row) {
    return null;
  }
  return row;
}

function initPuzzleTable() {
  if (!db) {
    console.error(
      "Failed to create tables: database is not initialized. Call initDb() before using the database.",
    );
    throw new Error("Cannot create tables: database is not initialized.");
  }
  const sql = `CREATE TABLE IF NOT EXISTS Puzzle (
      pId TEXT PRIMARY KEY,
      title TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      puzzleData TEXT
    )`;
  db.prepare(sql).run();
}

function upsertPuzzle(pId: string, title: string, puzzleData: string) {
  const sql = `INSERT OR REPLACE INTO Puzzle (pId, title, puzzleData) VALUES (?, ?, ?)`;
  db?.prepare(sql).run(pId, title, puzzleData);
}

function getPuzzleById(pId: string) {
  const sql = "SELECT pId, title, puzzleData FROM Puzzle WHERE pId = ?";
  const row = db?.prepare(sql).get(pId);
  if (!row) {
    return null;
  }
  return row;
}

interface PuzzleMetadata {
  sortBy: string;
  sortDir: number;
  title: string;
  rowRange: number;
}

function getPuzzleMetadata(metadata: PuzzleMetadata) {
  const { sortBy, sortDir, title, rowRange } = metadata;
  const sql = `SELECT pId, title, createdAt FROM Puzzle WHERE title LIKE ? ORDER BY ${sortBy} ${sortDir === 0 ? "ASC" : "DESC"} LIMIT ?`;
  const rows = db?.prepare(sql).all(`%${title}%`, rowRange);
  return rows || [];
}

function getPuzzleTotalNum(metadata: PuzzleMetadata) {
  const { title } = metadata;
  const sql = `SELECT COUNT(*) as count FROM Puzzle WHERE title LIKE ?`;
  const row = db?.prepare(sql).get(`%${title}%`) as
    | { count: number }
    | undefined;
  return row ? row.count : 0;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export {
  initDb,
  upsertRoom,
  fetchRoom,
  closeDb,
  getPuzzleMetadata,
  getPuzzleTotalNum,
  upsertPuzzle,
  getPuzzleById,
  type PuzzleMetadata,
};
