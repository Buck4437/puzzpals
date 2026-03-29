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
      author_id INTEGER NOT NULL REFERENCES "User"(id),
      description TEXT,
      puzzle_json JSONB NOT NULL,
      publish_date TIMESTAMP NOT NULL DEFAULT NOW(),
      published BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS "User" (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT,
      name TEXT,
      picture TEXT,
      is_guest BOOLEAN NOT NULL DEFAULT FALSE,
      guest_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

// User DB functions
import type { User } from "./models/User.js";

export async function upsertGoogleUser(
  google_id: string,
  email: string,
  name: string,
  picture: string,
): Promise<User> {
  const sql = `INSERT INTO "User" (google_id, email, name, picture, is_guest, last_login)
    VALUES ($1, $2, $3, $4, FALSE, NOW())
    ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_login = NOW()
    RETURNING *`;
  const result = await pool.query(sql, [google_id, email, name, picture]);
  return result.rows[0];
}

export async function createGuestUser(guest_name: string): Promise<User> {
  const sql = `INSERT INTO "User" (is_guest, guest_name, last_login) VALUES (TRUE, $1, NOW()) RETURNING *`;
  const result = await pool.query(sql, [guest_name]);
  return result.rows[0];
}

export async function getUserById(id: number): Promise<User | null> {
  const sql = `SELECT * FROM "User" WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getAllUsersDebug(): Promise<User[]> {
  const sql = `SELECT * FROM "User" ORDER BY created_at DESC`;
  const result = await pool.query(sql);
  return result.rows;
}

// Puzzle DB functions
export async function addPuzzle(
  title: string,
  author: string,
  author_id: number,
  description: string,
  puzzleJson: Grid,
  published = false,
) {
  const sql = `INSERT INTO Puzzle (title, author, author_id, description, puzzle_json, published)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
  const result = await pool.query(sql, [
    title,
    author,
    author_id,
    description,
    puzzleJson,
    published,
  ]);
  return result.rows[0] as Puzzle;
}

// Only author can update their puzzle: Author-check implemented here
export async function updatePuzzle(
  id: number,
  author_id: number,
  fields: {
    description?: string;
    puzzle_json?: object;
    published?: boolean;
    publish_date?: Date;
  },
) {
  // Only allow updating fields that are present
  const set: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (fields.description !== undefined) {
    set.push(`description = $${idx++}`);
    values.push(fields.description);
  }
  if (fields.puzzle_json !== undefined) {
    set.push(`puzzle_json = $${idx++}`);
    values.push(fields.puzzle_json);
  }
  if (fields.published !== undefined) {
    set.push(`published = $${idx++}`);
    values.push(fields.published);
  }
  if (fields.publish_date !== undefined) {
    set.push(`publish_date = $${idx++}`);
    values.push(fields.publish_date);
  }
  if (!set.length) throw new Error("No fields to update");
  // Only allow update if author_id matches
  const sql = `UPDATE Puzzle SET ${set.join(", ")} WHERE id = $${idx} AND author_id = $${idx + 1} RETURNING *`;
  values.push(id, author_id);
  const result = await pool.query(sql, values);
  return result.rows[0];
}

export async function getPuzzles(limit = 5) {
  const safeLimit = limit <= 0 ? 5 : limit;

  const sql = `SELECT * FROM Puzzle WHERE published = TRUE ORDER BY publish_date DESC LIMIT $1`;
  const result = await pool.query(sql, [safeLimit]);
  return result.rows as Puzzle[];
}

export async function getPuzzleById(id: number) {
  const sql = `SELECT * FROM Puzzle WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  const row = result.rows[0] as Puzzle | undefined;
  return row ?? null;
}

export async function getUserPuzzles(userId: number) {
  const sql = `SELECT * FROM Puzzle WHERE author_id = $1 ORDER BY publish_date DESC`;
  const result = await pool.query(sql, [userId]);
  return result.rows;
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
