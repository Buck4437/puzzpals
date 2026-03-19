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
      puzzle_data TEXT
    );
    CREATE TABLE IF NOT EXISTS Puzzle (
      id SERIAL PRIMARY KEY,
      author TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES "User"(id),
      description TEXT,
      puzzle_json JSONB NOT NULL,
      publish_date TIMESTAMP NOT NULL DEFAULT NOW()
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
  author: string,
  author_id: number,
  description: string,
  puzzleJson: object,
  publishDate?: Date,
) {
  const sql = `INSERT INTO Puzzle (author, author_id, description, puzzle_json, publish_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(sql, [
    author,
    author_id,
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
async function upsertRoom(token: string, puzzleJson: string) {
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
