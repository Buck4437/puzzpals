import type { Grid } from "@puzzpals/puzzle-models";

import type { Puzzle } from "./models/Puzzle.js";
import type { Room } from "./models/Room.js";
import pool from "./pool.js";

async function initDb() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to database");
    await createTable();
  } catch (err) {
    console.error("Database connection error:", (err as Error).message);
    throw err;
  }
}

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Room (
      token TEXT PRIMARY KEY UNIQUE,
      puzzle_data JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Puzzle (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      puzzle_json JSONB NOT NULL,
      publish_date TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

// Puzzle DB functions
export async function addPuzzle(
  title: string,
  author: string,
  description: string,
  puzzleJson: Grid,
) {
  const sql = `INSERT INTO Puzzle (title, author, description, puzzle_json, publish_date) 
               VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(sql, [
    title,
    author,
    description,
    puzzleJson,
    new Date(),
  ]);
  return result.rows[0] as Puzzle;
}

export async function getPuzzles(limit = 5) {
  const safeLimit = limit <= 0 ? 5 : limit;

  const sql = `SELECT * FROM Puzzle ORDER BY publish_date DESC LIMIT $1`;
  const result = await pool.query(sql, [safeLimit]);
  return result.rows as Puzzle[];
}

export async function getPuzzleById(id: number) {
  const sql = `SELECT * FROM Puzzle WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  const row = result.rows[0] as Puzzle | undefined;
  return row ?? null;
}

async function upsertRoom(room: Room) {
  const sql = `INSERT INTO Room (token, puzzle_data) VALUES ($1, $2)
               ON CONFLICT (token) DO UPDATE SET puzzle_data = EXCLUDED.puzzle_data`;
  await pool.query(sql, [room.token, room.puzzle_data]);
}

async function fetchRoom(token: string) {
  const sql = "SELECT * FROM Room WHERE token = $1";
  const result = await pool.query(sql, [token]);
  const row = result.rows[0] as Room | undefined;
  return row ?? null;
}

async function closeDb() {
  await pool.end();
}

export { closeDb, fetchRoom, initDb, upsertRoom };
