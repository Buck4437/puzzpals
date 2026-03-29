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
    // TODO: Get certificate for HTTPS
    rejectUnauthorized: false,
  },
});

console.log("Initializing database connection...");

export default pool;
