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
    )
  `);
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
