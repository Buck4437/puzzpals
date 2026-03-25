import type { GameData } from "@puzzpals/puzzle-models";
import type { Room } from "./models/Room.js";
import { Pool } from "pg";

function getConnectionString(): string {
  const {
    POSTGRES_HOST,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    POSTGRES_PORT,
  } = process.env;
  if (
    !POSTGRES_HOST ||
    !POSTGRES_USER ||
    !POSTGRES_PASSWORD ||
    !POSTGRES_DB ||
    !POSTGRES_PORT
  ) {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }
    throw new Error(
      "Database configuration is missing. Please set either DATABASE_URL or POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and POSTGRES_PORT in .env",
    );
  } else {
    return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
  }
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log("Initializing database connection...");

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
      author TEXT NOT NULL,
      description TEXT,
      puzzle_json JSONB NOT NULL,
      publish_date TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

// Puzzle DB functions
export async function addPuzzle(
  author: string,
  description: string,
  puzzleJson: object,
  publishDate?: Date,
) {
  const sql = `INSERT INTO Puzzle (author, description, puzzle_json, publish_date) VALUES ($1, $2, $3, $4) RETURNING *`;
  const result = await pool.query(sql, [
    author,
    description,
    puzzleJson,
    publishDate || new Date(),
  ]);
  return result.rows[0];
}

export async function getPuzzles(limit = 5) {
  const safeLimit = limit <= 0 ? 5 : limit;

  const sql = `SELECT * FROM Puzzle ORDER BY publish_date DESC LIMIT $1`;
  const result = await pool.query(sql, [safeLimit]);
  return result.rows;
}

export async function getPuzzleById(id: number) {
  const sql = `SELECT * FROM Puzzle WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
}
async function upsertRoom(token: string, puzzleJson: GameData) {
  const sql = `INSERT INTO Room (token, puzzle_data) VALUES ($1, $2)
               ON CONFLICT (token) DO UPDATE SET puzzle_data = EXCLUDED.puzzle_data`;
  await pool.query(sql, [token, puzzleJson]);
}

async function fetchRoom(token: string) {
  const sql = "SELECT * FROM Room WHERE token = $1";
  const result = await pool.query(sql, [token]);
  const row = result.rows[0] as Room | undefined;

  if (!row) {
    return null;
  }

  return row;
}

async function closeDb() {
  await pool.end();
}

export { initDb, upsertRoom, fetchRoom, closeDb };
