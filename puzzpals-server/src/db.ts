import {
  PUZZLE_AUTHOR_MAX_LENGTH,
  PUZZLE_DESCRIPTION_MAX_LENGTH,
  type PuzzleData,
} from "@puzzpals/puzzle-models";

import type { UploadedPuzzle } from "./models/UploadedPuzzle.js";
import type { Room } from "./models/Room.js";
import pool from "./pool.js";
import { mapDateForSql } from "./util/timeMapping.js";

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
    CREATE TABLE IF NOT EXISTS room (
      token TEXT PRIMARY KEY UNIQUE,
      puzzle_data JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_data (
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
    CREATE TABLE IF NOT EXISTS puzzle (
      id SERIAL PRIMARY KEY,
      author VARCHAR(${PUZZLE_AUTHOR_MAX_LENGTH}) NOT NULL,
      author_id INTEGER NOT NULL REFERENCES user_data(id),
      description VARCHAR(${PUZZLE_DESCRIPTION_MAX_LENGTH}) NOT NULL DEFAULT '',
      puzzle_json JSONB NOT NULL,
      publish_date TIMESTAMP NOT NULL DEFAULT NOW(),
      published BOOLEAN NOT NULL DEFAULT FALSE
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
  const sql = `INSERT INTO user_data (google_id, email, name, picture, is_guest, last_login)
    VALUES ($1, $2, $3, $4, FALSE, NOW())
    ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_login = NOW()
    RETURNING *`;
  const result = await pool.query(sql, [google_id, email, name, picture]);
  return result.rows[0];
}

export async function createGuestUser(guest_name: string): Promise<User> {
  const sql = `INSERT INTO user_data (is_guest, guest_name, last_login) VALUES (TRUE, $1, NOW()) RETURNING *`;
  const result = await pool.query(sql, [guest_name]);
  return result.rows[0];
}

export async function getUserById(id: number): Promise<User | null> {
  const sql = `SELECT * FROM user_data WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
}

// export async function getAllUsersDebug(): Promise<User[]> {
//   const sql = `SELECT * FROM user_data ORDER BY created_at DESC`;
//   const result = await pool.query(sql);
//   return result.rows;
// }

// Puzzle DB functions
export async function addPuzzle(
  author: string,
  author_id: number,
  description: string,
  puzzleJson: PuzzleData,
  published = false,
) {
  const sql = `INSERT INTO puzzle (author, author_id, description, puzzle_json, published)
               VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(sql, [
    author,
    author_id,
    description,
    puzzleJson,
    published,
  ]);
  return result.rows[0] as UploadedPuzzle;
}

// Only author can update their puzzle: Author-check implemented here
export async function updatePuzzle(
  id: number,
  author_id: number,
  author?: string,
  description?: string,
  puzzleJson?: PuzzleData,
  published?: boolean,
) {
  // Only allow updating fields that are present
  const set: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (author !== undefined) {
    set.push(`author = $${idx++}`);
    values.push(author);
  }
  if (description !== undefined) {
    set.push(`description = $${idx++}`);
    values.push(description);
  }
  if (puzzleJson !== undefined) {
    set.push(`puzzle_json = $${idx++}`);
    values.push(puzzleJson);
  }
  if (published !== undefined) {
    set.push(`published = $${idx++}`);
    values.push(published);
  }
  if (!set.length) throw new Error("No fields to update");
  // Only allow update if author_id matches
  const sql = `UPDATE puzzle SET ${set.join(", ")} WHERE id = $${idx} AND author_id = $${idx + 1} RETURNING *`;
  values.push(id, author_id);
  const result = await pool.query(sql, values);
  return result.rows[0] as UploadedPuzzle;
}

export async function getPuzzles({
  limit = 10,
  offset = 0,
  author,
  description,
  title,
  date_start,
  date_end,
  sort_field,
  sort_dir,
}: {
  limit?: number;
  offset?: number;
  author?: string | undefined;
  description?: string | undefined;
  title?: string | undefined;
  date_start?: string | undefined;
  date_end?: string | undefined;
  sort_field?: string | undefined;
  sort_dir?: string | undefined;
} = {}) {
  const safeLimit = limit <= 0 ? 10 : limit;
  const safeOffset = offset < 0 ? 0 : offset;
  const where: string[] = ["published = TRUE"];
  const values: (string | number)[] = [];
  let idx = 1;
  if (author) {
    where.push(`author ILIKE $${idx++}`);
    values.push(`%${author}%`);
  }
  if (description) {
    where.push(`description ILIKE $${idx++}`);
    values.push(`%${description}%`);
  }
  if (title) {
    where.push(`puzzle_json->>'title' ILIKE $${idx++}`);
    values.push(`%${title}%`);
  }
  if (date_start) {
    const startVal = mapDateForSql(date_start, "start");
    where.push(`publish_date >= $${idx++}`);
    values.push(startVal);
  }
  if (date_end) {
    const endVal = mapDateForSql(date_end, "end");
    where.push(`publish_date <= $${idx++}`);
    values.push(endVal);
  }
  // Sorting
  let orderBy = "publish_date DESC";
  const allowedFields: Record<string, string> = {
    publish_date: "publish_date",
    // Case-insensitive sorting
    title: `LOWER(COALESCE(puzzle_json->>'title', ''))`,
    author: "author",
  };
  const allowedDirs = ["asc", "desc"];
  if (sort_field && allowedFields[sort_field]) {
    const dir = (sort_dir || "desc").toLowerCase();
    orderBy = `${allowedFields[sort_field]} ${allowedDirs.includes(dir) ? dir.toUpperCase() : "DESC"}`;
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT * FROM puzzle ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`;
  values.push(safeLimit, safeOffset);
  const result = await pool.query(sql, values);
  return result.rows as UploadedPuzzle[];
}

export async function getPuzzleById(id: number) {
  const sql = `SELECT * FROM puzzle WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  const row = result.rows[0] as UploadedPuzzle | undefined;
  return row ?? null;
}

export async function getUserPuzzles(
  userId: number,
  {
    limit = 10,
    offset = 0,
    description,
    title,
    date_start,
    date_end,
    sort_field,
    sort_dir,
    published,
  }: {
    limit?: number;
    offset?: number;
    description?: string | undefined;
    title?: string | undefined;
    date_start?: string | undefined;
    date_end?: string | undefined;
    sort_field?: string | undefined;
    sort_dir?: string | undefined;
    published?: boolean | undefined;
  } = {},
) {
  const safeLimit = limit <= 0 ? 30 : limit;
  const safeOffset = offset < 0 ? 0 : offset;
  const where: string[] = ["author_id = $1"];
  const values: (string | number | boolean)[] = [userId];
  let idx = 2;
  if (typeof published === "boolean") {
    where.push(`published = $${idx++}`);
    values.push(published);
  }

  if (description) {
    where.push(`description ILIKE $${idx++}`);
    values.push(`%${description}%`);
  }
  if (title) {
    where.push(`puzzle_json->>'title' ILIKE $${idx++}`);
    values.push(`%${title}%`);
  }
  if (date_start) {
    const startVal = mapDateForSql(date_start, "start");
    where.push(`publish_date >= $${idx++}`);
    values.push(startVal);
  }
  if (date_end) {
    const endVal = mapDateForSql(date_end, "end");
    where.push(`publish_date <= $${idx++}`);
    values.push(endVal);
  }

  let orderBy = "publish_date DESC";
  const allowedFields: Record<string, string> = {
    publish_date: "publish_date",
    title: `puzzle_json->>'title'`,
  };
  const allowedDirs = ["asc", "desc"];
  if (sort_field && allowedFields[sort_field]) {
    const dir = (sort_dir || "desc").toLowerCase();
    orderBy = `${allowedFields[sort_field]} ${allowedDirs.includes(dir) ? dir.toUpperCase() : "DESC"}`;
  }

  const whereClause = `WHERE ${where.join(" AND ")}`;
  const sql = `SELECT * FROM puzzle ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`;
  values.push(safeLimit, safeOffset);
  const result = await pool.query(sql, values);
  return result.rows as UploadedPuzzle[];
}

async function upsertRoom(room: Room) {
  const sql = `INSERT INTO room (token, puzzle_data) VALUES ($1, $2)
               ON CONFLICT (token) DO UPDATE SET puzzle_data = EXCLUDED.puzzle_data`;
  await pool.query(sql, [room.token, room.puzzle_data]);
}

async function fetchRoom(token: string) {
  const sql = "SELECT * FROM room WHERE token = $1";
  const result = await pool.query(sql, [token]);
  const row = result.rows[0] as Room | undefined;
  return row ?? null;
}

async function closeDb() {
  await pool.end();
}

export { closeDb, fetchRoom, initDb, upsertRoom };
